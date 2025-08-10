import { CronTaskData } from "@/types.js";
import useClient from "../../utils/use-client.js";

const client = useClient();

export const data: CronTaskData = {
	name: "clearDeletedUsers",
	task: async () => {
		const users = await client.getUsersData();

		for (const u of users) {
			const user = client.users.cache.get(u.id);

			if (user?.username.includes("deleted_user_")) {
				await u.deleteOne();
			}
		}

		client.guilds.cache.forEach(async guild => {
			const members = await client.getMembersData(guild.id);

			for (const m of members) {
				const user = client.users.cache.get(m.id);

				if (user?.username.includes("deleted_user_")) {
					await m.deleteOne();
				}
			}
		});
	},
	schedule: "0 0 * * MON",
};
