import logger from "@/helpers/logger.js";
import { CronTaskData } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();

export const data: CronTaskData = {
	name: "clearDeletedUsers",
	task: async () => {
		const users = await client.getUsersData();

		for (const u of users)
			try {
				const user = client.users.cache.get(u.id);

				if (user?.username.includes("deleted_user_")) await u.deleteOne();
			} catch (e) {
				logger.error(`[clearDeletedUsers] Error in user ${u.id}:`, e);
			}

		client.guilds.cache.forEach(async guild => {
			const members = await client.getMembersData(guild.id);

			for (const m of members)
				try {
					const user = client.users.cache.get(m.id);

					if (user?.username.includes("deleted_user_")) await m.deleteOne();
				} catch (e) {
					logger.error(`[clearDeletedUsers] Error in member ${m.id}:`, e);
				}
		});
	},
	schedule: "0 0 * * *",
};
