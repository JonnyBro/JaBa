import logger from "@/helpers/logger.js";
import UserModel, { UserReminds } from "@/models/UserModel.js";
import { CronTaskData } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";

const client = useClient();

const buildRemindEmbed = (remind: UserReminds) =>
	createEmbed({
		author: {
			name: client.i18n.translate("general/remindme:EMBED_TITLE"),
		},
		fields: [
			{
				name: client.i18n.translate("general/remindme:EMBED_CREATED"),
				value: `<t:${remind.createdAt}:f>`,
				inline: true,
			},
			{
				name: client.i18n.translate("general/remindme:EMBED_TIME"),
				value: `<t:${remind.sendAt}:f>`,
				inline: true,
			},
			{
				name: client.i18n.translate("common:MESSAGE"),
				value: remind.message,
			},
		],
	});

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
						?.send({ embeds: [buildRemindEmbed(remind)] })
						.catch(e => logger.warn(`[checkReminds] Can't send a remind to ${userData.id}:`, e.message));

				// Remove even undelivered ones (closed DMs), otherwise they would be retried every minute forever
				await UserModel.updateOne({ id: userData.id }, { $pull: { reminds: { sendAt: { $lte: now } } } });
			} catch (e) {
				logger.error(`[checkReminds] Error in user ${userData.id}:`, e);
			}
	},
	schedule: "* * * * *",
};
