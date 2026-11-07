import logger from "@/helpers/logger.js";
import UserModel from "@/models/UserModel.js";
import { CronTaskData } from "@/types.js";
import { createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import { MessageFlags } from "discord.js";

const client = useClient();

const MEMBERS_CHUNK_SIZE = 100;

export const data: CronTaskData = {
	name: "checkBirthdays",
	task: async () => {
		if (!client.isReady()) return;

		const today = new Date();
		const users = (await UserModel.find({ birthdate: { $ne: null } }))
			.filter(u => !isNaN(u.birthdate!))
			.map(u => ({ id: u.id, date: new Date(u.birthdate!), hideAge: u.hideAge }))
			.filter(u => u.date.getDate() === today.getDate() && u.date.getMonth() === today.getMonth());

		if (!users.length) return;

		for (const guild of client.guilds.cache.values())
			try {
				const guildData = await client.getGuildData(guild.id);
				const channelId = guildData.plugins.birthdays;
				if (!channelId) continue;

				const channel = await client.channels.fetch(channelId).catch(() => null);
				if (!channel?.isSendable()) continue;

				const memberIds = new Set<string>();
				for (let i = 0; i < users.length; i += MEMBERS_CHUNK_SIZE) {
					const members = await guild.members.fetch({
						user: users.slice(i, i + MEMBERS_CHUNK_SIZE).map(u => u.id),
					});

					members.forEach(m => memberIds.add(m.id));
				}

				for (const { id, date, hideAge } of users.filter(u => memberIds.has(u.id))) {
					const lng = guildData.language;
					const title = client.i18n.translate("economy/birthdate:HAPPY_BIRTHDAY", { lng });
					const text = client.i18n.translate(
						`economy/birthdate:${hideAge ? "HAPPY_BIRTHDAY_MESSAGE_NO_AGE" : "HAPPY_BIRTHDAY_MESSAGE"}`,
						{ user: `<@${id}>`, age: String(today.getFullYear() - date.getFullYear()), lng },
					);
					const container = createContainer().addTextDisplayComponents(
						createText(`## 🎂 ${title}`),
						createText(text),
					);

					await channel
						.send({
							flags: MessageFlags.IsComponentsV2,
							components: [container],
							allowedMentions: { users: [id] },
						})
						.then(m => m.react("🎉"));
				}
			} catch (e) {
				logger.error(`[checkBirthdays] Error in guild ${guild.id}:`, e);
			}
	},
	schedule: "0 5 * * *",
};
