import logger from "@/helpers/logger.js";
import UserModel, { UserReminds } from "@/models/UserModel.js";
import { CronTaskData } from "@/types.js";
import { containerMessage, createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";

const client = useClient();

const buildRemind = (remind: UserReminds) =>
	containerMessage(
		createContainer().addTextDisplayComponents(
			createText(`## ⏰ ${client.i18n.translate("general/remindme:EMBED_TITLE")}`),
			createText(remind.message),
			createText(`-# ${client.i18n.translate("general/remindme:EMBED_CREATED")} <t:${remind.createdAt}:f>`),
		),
	);

export const data: CronTaskData = {
	name: "checkReminds",
	task: async () => {
		const now = Math.floor(Date.now() / 1000);
		const users = await UserModel.find({ "reminds.sendAt": { $lte: now } });

		for (const userData of users)
			try {
				const user = await client.users.fetch(userData.id).catch(() => null);

				for (const remind of userData.reminds.filter(r => r.sendAt <= now))
					await user
						?.send(buildRemind(remind))
						.catch(e => logger.warn(`[checkReminds] Can't send a remind to ${userData.id}:`, e.message));

				// Remove even undelivered ones (closed DMs), otherwise they would be retried every minute forever
				await UserModel.updateOne({ id: userData.id }, { $pull: { reminds: { sendAt: { $lte: now } } } });
			} catch (e) {
				logger.error(`[checkReminds] Error in user ${userData.id}:`, e);
			}
	},
	schedule: "* * * * *",
};
