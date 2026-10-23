import logger from "@/helpers/logger.js";
import { Migration } from "./types.js";

const unsetFields = (fields: string[]) => Object.fromEntries(fields.map(field => [field, ""]));

const LEGACY_FIELDS = {
	guilds: [
		"membersData",
		"members",
		"reconnect",
		"reconnects",
		"plugins.welcome",
		"plugins.goodbye",
		"plugins.music",
		"plugins.autorole",
		"plugins.automod",
		"plugins.warnsSanctions",
		"plugins.monitoring",
		"plugins.tickets",
		"plugins.suggestions",
		"plugins.reports",
		"plugins.modlogs",
	],
	users: ["achievements", "lover", "afk", "logged", "apiToken"],
	members: ["workStreak", "sanctions", "mute"],
};

export default {
	id: "006-remove-legacy-data",
	description: "Remove fields and collections that are no longer used",
	up: async db => {
		for (const [name, fields] of Object.entries(LEGACY_FIELDS)) {
			const result = await db
				.collection(name)
				.updateMany(
					{ $or: fields.map(field => ({ [field]: { $exists: true } })) },
					{ $unset: unsetFields(fields) },
				);

			logger.info(`[Migrations] Removed legacy fields from ${result.modifiedCount} document(s) in ${name}`);
		}

		const collections = await db.listCollections({ name: "logs" }).toArray();

		if (collections.length) {
			await db.dropCollection("logs");
			logger.info("[Migrations] Dropped the legacy logs collection");
		}
	},
} satisfies Migration;
