import logger from "@/helpers/logger.js";
import MemberModel from "@/models/MemberModel.js";
import UserModel from "@/models/UserModel.js";
import { CronTaskData } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";

const client = useClient();

const DELETED_USERNAME_PREFIX = "deleted_user_";

const isDeletedAccount = async (id: string) => {
	const cached = client.users.cache.get(id);
	if (cached && !cached.username.startsWith(DELETED_USERNAME_PREFIX)) return false;

	try {
		const user = await client.users.fetch(id, { force: true });

		return user.username.startsWith(DELETED_USERNAME_PREFIX);
	} catch (error) {
		if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.UnknownUser) return true;

		throw error;
	}
};

export const data: CronTaskData = {
	name: "clearDeletedUsers",
	task: async () => {
		const ids = new Set<string>([...(await UserModel.distinct("id")), ...(await MemberModel.distinct("id"))]);
		let removed = 0;

		for (const id of ids)
			try {
				if (!(await isDeletedAccount(id))) continue;

				await UserModel.deleteMany({ id });
				await MemberModel.deleteMany({ id });
				removed++;
			} catch (e) {
				logger.error(`[clearDeletedUsers] Error in user ${id}:`, e);
			}

		logger.info(`[clearDeletedUsers] Checked ${ids.size} user(s), removed ${removed} deleted account(s)`);
	},
	schedule: "0 0 * * *",
};
