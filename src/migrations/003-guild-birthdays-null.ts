import logger from "@/helpers/logger.js";
import { Migration } from "./types.js";

export default {
	id: "003-guild-birthdays-null",
	description: "Store a disabled birthdays channel as null",
	up: async db => {
		// It used to be null, then false, which mongoose saved as the string "false"
		const result = await db
			.collection("guilds")
			.updateMany({ "plugins.birthdays": { $not: /^\d+$/ } }, { $set: { "plugins.birthdays": null } });

		logger.info(`[Migrations] Reset the birthdays channel in ${result.modifiedCount} guild(s)`);
	},
} satisfies Migration;
