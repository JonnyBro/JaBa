import useClient from "../../utils/use-client.js";
import { CronTaskData } from "@/types.js";
import MemberModel from "@/models/MemberModel.js";

export const data: CronTaskData = {
	name: "clearTransactions",
	task: async () => {
		const client = useClient();
		const members = await client.adapter.find(MemberModel, { transactions: { $gt: [] } });

		for (const member of members) {
			if (member.transactions.length > 20) {
				member.transactions.length = 20;
				await member.save();
			}
		}
	},
	schedule: "0 0 * * MON",
};
