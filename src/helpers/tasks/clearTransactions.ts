import logger from "@/helpers/logger.js";
import MemberModel from "@/models/MemberModel.js";
import { CronTaskData } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();

export const data: CronTaskData = {
	name: "clearTransactions",
	task: async () => {
		const members = await client.adapter.find(MemberModel, { transactions: { $gt: [] } });

		for (const member of members)
			try {
				if (member.transactions.length > 20) {
					member.set("transactions", member.transactions.slice(0, 19));
					await member.save();
				}
			} catch (e) {
				logger.error(`[clearTransactions] Error in member ${member.id}:`, e);
			}
	},
	schedule: "0 0 * * *",
};
