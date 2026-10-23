import logger from "@/helpers/logger.js";
import { Migration } from "./types.js";

const number = (field: string) => ({ $convert: { input: field, to: "double", onError: 0, onNull: 0 } });
const positive = (field: string) => ({ $max: [0, number(field)] });
const stringOr = (field: string, fallback: string | null) => ({
	$cond: [{ $eq: [{ $type: field }, "string"] }, field, fallback],
});
const numberOr = (field: string, fallback: unknown) => ({ $cond: [{ $isNumber: field }, field, fallback] });
const arrayOr = (field: string, item: Record<string, unknown>) => ({
	$cond: [{ $isArray: field }, { $map: { input: field, as: "item", in: item } }, []],
});

const NOW_MS = { $toLong: "$$NOW" };
const NOW_SECONDS = { $floor: { $divide: [NOW_MS, 1000] } };

export default {
	id: "007-normalize-documents",
	description: "Fix field types in members and users that the model hooks used to patch on save",
	up: async db => {
		const members = await db.collection("members").updateMany({}, [
			{
				$set: {
					money: positive("$money"),
					bank: positive("$bank"),
					exp: positive("$exp"),
					level: positive("$level"),
					registeredAt: { $cond: [{ $gt: [number("$registeredAt"), 0] }, "$registeredAt", NOW_MS] },
					cooldowns: { work: number("$cooldowns.work"), rob: number("$cooldowns.rob") },
					transactions: arrayOr("$transactions", {
						user: stringOr("$$item.user", ""),
						amount: number("$$item.amount"),
						date: numberOr("$$item.date", NOW_MS),
						type: stringOr("$$item.type", "unknown"),
					}),
				},
			},
		]);

		const users = await db.collection("users").updateMany({}, [
			{
				$set: {
					rep: number("$rep"),
					bio: stringOr("$bio", null),
					registeredAt: { $cond: [{ $gt: [number("$registeredAt"), 0] }, "$registeredAt", NOW_MS] },
					cooldowns: { rep: number("$cooldowns.rep") },
					reminds: arrayOr("$reminds", {
						message: stringOr("$$item.message", ""),
						createdAt: numberOr("$$item.createdAt", NOW_SECONDS),
						sendAt: numberOr("$$item.sendAt", NOW_SECONDS),
					}),
				},
			},
		]);

		logger.info(`[Migrations] Normalized ${members.modifiedCount} member(s) and ${users.modifiedCount} user(s)`);
	},
} satisfies Migration;
