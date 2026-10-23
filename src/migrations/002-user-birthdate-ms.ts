import logger from "@/helpers/logger.js";
import { Migration } from "./types.js";

// In seconds this covers years 1653-2286, in milliseconds only dates within ~4 months of 1970-01-01
const SECONDS_LIMIT = 1e10;

export default {
	id: "002-user-birthdate-ms",
	description: "Convert birthdates stored in seconds to milliseconds",
	up: async db => {
		const users = db.collection("users");

		// Before c374532c the birthdate was saved in seconds
		const converted = await users.updateMany(
			{ birthdate: { $type: "number", $gt: -SECONDS_LIMIT, $lt: SECONDS_LIMIT, $ne: 0 } },
			[{ $set: { birthdate: { $multiply: ["$birthdate", 1000] } } }],
		);

		const cleared = await users.updateMany(
			{ birthdate: { $exists: true, $ne: null, $not: { $type: "number" } } },
			{ $set: { birthdate: null } },
		);

		logger.info(`[Migrations] Converted ${converted.modifiedCount} birthdate(s) to ms`);
		logger.info(`[Migrations] Cleared ${cleared.modifiedCount} invalid birthdate(s)`);
	},
} satisfies Migration;
