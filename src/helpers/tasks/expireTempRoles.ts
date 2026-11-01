import logger from "@/helpers/logger.js";
import TempRoleModel from "@/models/TempRoleModel.js";
import { CronTaskData } from "@/types.js";
import useClient from "@/utils/use-client.js";

export const data: CronTaskData = {
	name: "expireTempRoles",
	task: async () => {
		const client = useClient();
		const expired = await TempRoleModel.find({ expiresAt: { $lte: new Date() } }).lean();

		for (const entry of expired) {
			const guild = client.guilds.cache.get(entry.guildId);

			// Members who left already lost the role, and a server the bot left can't be cleaned up anyway
			const member = guild && (await guild.members.fetch(entry.userId).catch(() => null));
			if (member?.roles.cache.has(entry.roleId))
				await member.roles.remove(entry.roleId, "Shop role expired").catch(error => {
					logger.warn(`[Shop] Can't remove temp role ${entry.roleId} from ${entry.userId}:`, error.message);
				});

			await TempRoleModel.deleteOne({ _id: entry._id, expiresAt: entry.expiresAt });
		}
	},
	schedule: "* * * * *",
};
