import MemberModel from "@/models/MemberModel.js";
import { CronTaskData } from "@/types.js";

const MAX_TRANSACTIONS = 20;

export const data: CronTaskData = {
	name: "clearTransactions",
	task: async () => {
		await MemberModel.updateMany(
			{ [`transactions.${MAX_TRANSACTIONS}`]: { $exists: true } },
			{ $push: { transactions: { $each: [], $sort: { date: 1 }, $slice: -MAX_TRANSACTIONS } } },
		);
	},
	schedule: "0 0 * * *",
};
