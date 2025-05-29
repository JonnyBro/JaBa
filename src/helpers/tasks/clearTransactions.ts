import MemberModel from "@/models/MemberModel.js";
import { CronTaskData } from "@/types.js";
import useClient from "../../utils/use-client.js";

const client = useClient();

export const data: CronTaskData = {
	name: "clearTransactions",
	task: async () => {
		const members = await client.adapter.find(MemberModel, { transactions: { $gt: [] } });

		for (const member of members) {
			if (member.transactions.length > 20) {
				member.set("transactions", member.transactions.slice(0, 19));
				await member.save();
			}
		}
	},
	schedule: "0 0 * * MON",
};
