import logger from "@/helpers/logger.js";
import UserModel, { UserReminds } from "@/models/UserModel.js";
import { CronTaskData } from "@/types.js";
import { containerMessage, createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const client = useClient();

const buildRemind = (remind: UserReminds) => {
	const container = createContainer().addTextDisplayComponents(
		createText(`## ⏰ ${client.i18n.translate("general/remindme:EMBED_TITLE")}`),
		createText(remind.message),
		createText(`-# ${client.i18n.translate("general/remindme:EMBED_CREATED")} <t:${remind.createdAt}:f>`),
	);

	if (remind.url)
		container.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel(client.i18n.translate("general/remindme:GO_TO_MESSAGE"))
					.setURL(remind.url),
			),
		);

	return containerMessage(container);
};

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
