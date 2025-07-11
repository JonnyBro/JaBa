import { asyncForEach } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import UserModel from "@/models/UserModel.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";

const client = useClient();

export const data = {
	name: "checkBirthdays",
	task: async () => {
		const guilds = client.guilds.cache.values();
		const users = await client.adapter.find(UserModel, {
			birthdate: { $ne: null },
		});

		const currentData = new Date();
		const currentYear = currentData.getFullYear();
		const currentMonth = currentData.getMonth();
		const currentDate = currentData.getDate();

		for (const guild of guilds) {
			try {
				const data = await client.getGuildData(guild.id);
				if (!data.plugins.birthdays) return;

				const channel = await client.channels.fetch(data.plugins.birthdays);
				if (!channel) return;
				if (!channel.isSendable()) return;

				const userIDs: string[] = users
					.filter(u => guild.members.cache.has(u.id))
					.map(u => u.id);

				await asyncForEach(userIDs, async userID => {
					const user = users.find(u => u.id === userID);
					if (!user) return;

					const userData =
						new Date(user.birthdate!).getFullYear() <= 1970
							? new Date(user.birthdate! * 1000)
							: new Date(user.birthdate!);
					const userYear = userData.getFullYear();
					const userMonth = userData.getMonth();
					const userDate = userData.getDate();

					const age = currentYear - userYear;

					if (userDate === currentDate && userMonth === currentMonth) {
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
				});
			} catch (error) {
				logger.error(error);
			}
		}
	},
	schedule: "0 5 * * *",
};
