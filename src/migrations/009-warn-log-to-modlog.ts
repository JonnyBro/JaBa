import logger from "@/helpers/logger.js";
import { Migration } from "./types.js";

// A frozen copy: the model needs the client, which migrations run before, and old migrations must not change
const MODLOG_EVENTS = [
	"messageDelete",
	"messageEdit",
	"memberJoin",
	"memberLeave",
	"ban",
	"unban",
	"kick",
	"timeout",
	"nickname",
	"roles",
	"warns",
];

export default {
	id: "009-warn-log-to-modlog",
	description: "Move the warn log channel into the moderation log",
	up: async db => {
		const guilds = db.collection("guilds");

		// Only warns stay on, the other events would suddenly start flooding a channel picked for warns
		const events = Object.fromEntries(MODLOG_EVENTS.map(event => [event, event === "warns"]));
		const moved = await guilds.updateMany(
			{ "plugins.warns.logChannel": { $type: "string" }, "plugins.modlog": { $exists: false } },
			[{ $set: { "plugins.modlog": { channel: "$plugins.warns.logChannel", events, ignoredChannels: [] } } }],
		);

		await guilds.updateMany(
			{ "plugins.warns.logChannel": { $exists: true } },
			{ $unset: { "plugins.warns.logChannel": "" } },
		);

		logger.info(`[Migrations] Moved the warn log channel to the moderation log in ${moved.modifiedCount} guild(s)`);
	},
} satisfies Migration;
