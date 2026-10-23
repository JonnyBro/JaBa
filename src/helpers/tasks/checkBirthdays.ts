import logger from "@/helpers/logger.js";
import UserModel from "@/models/UserModel.js";
import { CronTaskData } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";

const client = useClient();

const MEMBERS_CHUNK_SIZE = 100;

const toBirthDate = (birthdate: number) =>
	new Date(birthdate).getFullYear() <= 1970 ? new Date(birthdate * 1000) : new Date(birthdate);

export const data: CronTaskData = {
	name: "checkBirthdays",
	task: async () => {
		if (!client.isReady()) return;

		const today = new Date();
		const users = (await UserModel.find({ birthdate: { $ne: null } }))
			.filter(u => !isNaN(u.birthdate!))
			.map(u => ({ id: u.id, date: toBirthDate(u.birthdate!) }))
			.filter(u => u.date.getDate() === today.getDate() && u.date.getMonth() === today.getMonth());

		if (!users.length) return;

		for (const guild of client.guilds.cache.values())
			try {
				const guildData = await client.getGuildData(guild.id);
				const channelId = String(guildData.plugins.birthdays);
				if (!/^\d+$/.test(channelId)) continue;

				const channel = await client.channels.fetch(channelId).catch(() => null);
				if (!channel?.isSendable()) continue;

				const memberIds = new Set<string>();
				for (let i = 0; i < users.length; i += MEMBERS_CHUNK_SIZE) {
					const members = await guild.members.fetch({
						user: users.slice(i, i + MEMBERS_CHUNK_SIZE).map(u => u.id),
					});

					members.forEach(m => memberIds.add(m.id));
				}

				for (const { id, date } of users.filter(u => memberIds.has(u.id))) {
					const embed = createEmbed({
						author: {
							name: client.user.username,
						},
						fields: [
							{
								name: client.i18n.translate("economy/birthdate:HAPPY_BIRTHDAY", {
									lng: guildData.language,
								}),
								value: client.i18n.translate("economy/birthdate:HAPPY_BIRTHDAY_MESSAGE", {
									user: `<@${id}>`,
									age: String(today.getFullYear() - date.getFullYear()),
									lng: guildData.language,
								}),
							},
						],
					});

					await channel.send({ embeds: [embed] }).then(m => m.react("🎉"));
				}
			} catch (e) {
				logger.error(`[checkBirthdays] Error in guild ${guild.id}:`, e);
			}
	},
	schedule: "0 5 * * *",
};
