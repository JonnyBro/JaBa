import logger from "@/helpers/logger.js";
import { Migration } from "./types.js";

const toNumber = (field: string) => ({ $convert: { input: field, to: "double", onError: 0, onNull: 0 } });

export default {
	id: "001-member-bank-sold",
	description: "Move the old bankSold balance into bank",
	up: async db => {
		// bankSold was renamed to bank in 3990a693, members could have deposited into both since then
		const result = await db
			.collection("members")
			.updateMany({ bankSold: { $exists: true } }, [
				{ $set: { bank: { $add: [toNumber("$bank"), toNumber("$bankSold")] } } },
				{ $unset: "bankSold" },
			]);

		logger.info(`[Migrations] Moved bankSold into bank for ${result.modifiedCount} member(s)`);
	},
} satisfies Migration;
