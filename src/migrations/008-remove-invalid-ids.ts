import logger from "@/helpers/logger.js";
import { Migration } from "./types.js";

// $not with a regex also matches documents where the field is missing, null or not a string
const notSnowflake = { $not: /^\d{15,22}$/ };

export default {
	id: "008-remove-invalid-ids",
	description: "Remove users and members without a valid Discord ID",
	up: async db => {
		const users = await db.collection("users").deleteMany({ id: notSnowflake });
		const members = await db
			.collection("members")
			.deleteMany({ $or: [{ id: notSnowflake }, { guildID: notSnowflake }] });

		logger.info(
			`[Migrations] Removed ${users.deletedCount} user(s) and ${members.deletedCount} member(s) with invalid IDs`,
		);
	},
} satisfies Migration;
