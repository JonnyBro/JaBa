import logger from "@/helpers/logger.js";
import UserModel from "@/models/UserModel.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";

const client = useClient();

export const data = {
	name: "checkBirthdays",
	task: async () => {
		if (!client.isReady()) return;

		const guilds = client.guilds.cache.values();
		const users = await client.db.find(UserModel, {
			birthdate: { $ne: null },
		});

		const date = new Date();
		const currentYear = date.getFullYear();
		const currentMonth = date.getMonth();
		const currentDate = date.getDate();

		for (const guild of guilds)
			try {
				const guildData = await client.getGuildData(guild.id);
				if (typeof guildData.plugins.birthdays !== "string") continue;

				const channel = await client.channels.fetch(guildData.plugins.birthdays);
				if (!channel || !channel.isSendable()) continue;

				const userIDs: string[] = users.filter(u => guild.members.cache.has(u.id)).map(u => u.id);

				for (const userID of userIDs) {
					const userData = users.find(u => u.id === userID);
					if (!userData || !userData.birthdate) continue;
					if (isNaN(userData.birthdate)) continue;

					const user = await client.users.fetch(userData.id);
					const userDate =
						new Date(userData.birthdate).getFullYear() <= 1970
							? new Date(userData.birthdate * 1000)
							: new Date(userData.birthdate);

					if (userDate.getDate() === currentDate && userDate.getMonth() === currentMonth) {
						const age = currentYear - userDate.getFullYear();
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
										user: user.toString(),
										age: age.toString(),
										lng: guildData.language,
									}),
								},
							],
						});

						await channel.send({ embeds: [embed] }).then(m => m.react("🎉"));
					}
				}
			} catch (e) {
				logger.error(`[checkBirthdays] Error in guild ${guild.id}:`, e);
			}
	},
	schedule: "0 5 * * *",
};
