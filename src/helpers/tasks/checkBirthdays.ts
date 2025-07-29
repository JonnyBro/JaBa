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
		const users = await client.adapter.find(UserModel, {
			birthdate: { $ne: false },
		});

		const currentData = new Date();
		const currentYear = currentData.getFullYear();
		const currentMonth = currentData.getMonth();
		const currentDate = currentData.getDate();

		for (const guild of guilds) {
			try {
				const data = await client.getGuildData(guild.id);
				if (!data.plugins.birthdays) continue;

				const channel = await client.channels.fetch(data.plugins.birthdays);
				if (!channel || !channel.isSendable()) continue;

				const userIDs: string[] = users
					.filter(u => guild.members.cache.has(u.id))
					.map(u => u.id);

				for (const userID of userIDs) {
					const user = users.find(u => u.id === userID);
					if (!user || !user.birthdate) continue;
					if (isNaN(user.birthdate)) continue;

					const userData =
						new Date(user.birthdate).getFullYear() <= 1970
							? new Date(user.birthdate! * 1000)
							: new Date(user.birthdate!);

					if (
						userData.getDate() === currentDate &&
						userData.getMonth() === currentMonth
					) {
						const age = currentYear - userData.getFullYear();
						const embed = createEmbed({
							author: {
								name: client.user.username,
							},
							fields: [
								{
									name: client.i18n.translate(
										"economy/birthdate:HAPPY_BIRTHDAY",
										{
											lng: data.language,
										},
									),
									value: client.i18n.translate(
										"economy/birthdate:HAPPY_BIRTHDAY_MESSAGE",
										{
											lng: data.language,
											user: user.id,
											age: age.toString(),
										},
									),
								},
							],
						});

						await channel.send({ embeds: [embed] }).then(m => m.react("🎉"));
					}
				}
			} catch (e) {
				logger.error(`Birthday error in guild ${guild.id}:`, e);
			}
		}
	},
	schedule: "0 5 * * *",
};
