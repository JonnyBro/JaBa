import DashboardSessionModel from "@/models/DashboardSessionModel.js";
import { SessionStore } from "@fastify/session";
import { Session } from "fastify";

type Callback = (error?: unknown) => void;

/** Keeps dashboard logins in Mongo, so they survive a restart of the bot */
export class MongoSessionStore implements SessionStore {
	constructor(private readonly ttl: number) {}

	// The expiry is only written once, so a login lasts exactly ttl no matter how often the session changes
	set(sessionId: string, session: Session, callback: Callback) {
		const data = JSON.parse(JSON.stringify(session)) as Record<string, unknown>;

		DashboardSessionModel.updateOne(
			{ _id: sessionId },
			{ $set: { data }, $setOnInsert: { expiresAt: new Date(Date.now() + this.ttl) } },
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

	destroy(sessionId: string, callback: Callback) {
		DashboardSessionModel.deleteOne({ _id: sessionId }).then(() => callback(), callback);
	}
}
