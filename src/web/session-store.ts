import DashboardSessionModel from "@/models/DashboardSessionModel.js";
import { SessionStore } from "@fastify/session";
import { Session } from "fastify";

type Callback = (error?: unknown) => void;

const GENERATION_PATH = "data.__fastifySessionMetadata.generation";

const serialize = (session: Session) => JSON.parse(JSON.stringify(session)) as Record<string, unknown>;

export class MongoSessionStore implements SessionStore {
	constructor(private readonly ttl: number) {}

	// The expiry is only written once, so a login lasts exactly ttl no matter how often the session changes
	set(sessionId: string, session: Session, callback: Callback) {
		DashboardSessionModel.updateOne(
			{ _id: sessionId },
			{ $set: { data: serialize(session) }, $setOnInsert: { expiresAt: new Date(Date.now() + this.ttl) } },
			{ upsert: true },
		).then(() => callback(), callback);
	}

	get(sessionId: string, callback: (error: unknown, session?: Session | null) => void) {
		DashboardSessionModel.findById(sessionId)
			.lean()
			.then(doc => {
				// The TTL index only runs about once a minute, so expired ones can still be found
				if (!doc || doc.expiresAt.getTime() < Date.now()) return callback(null, null);

				callback(null, doc.data as unknown as Session);
			}, callback);
	}

	// Only overwrites the session if it still exists and wasn't regenerated, so a slow request can't bring back
	// a session that was logged out or replaced in the meantime. Sessions saved before the library added
	// generations have none, and their generation is the session id then
	compareAndSet(sessionId: string, expectedGeneration: string, session: Session, callback: Callback) {
		const generations: Record<string, unknown>[] = [{ [GENERATION_PATH]: expectedGeneration }];
		if (expectedGeneration === sessionId) generations.push({ [GENERATION_PATH]: { $exists: false } });

		DashboardSessionModel.updateOne(
			{ _id: sessionId, expiresAt: { $gt: new Date() }, $or: generations },
			{ $set: { data: serialize(session) } },
		).then(result => {
			if (result.matchedCount) return callback();

			callback(Object.assign(new Error("The session does not exist or has changed"), { code: "ENOENT" }));
		}, callback);
	}

	destroy(sessionId: string, callback: Callback) {
		DashboardSessionModel.deleteOne({ _id: sessionId }).then(() => callback(), callback);
	}
}
