import useClient from "@/utils/use-client.js";
import { User } from "@/models/UserModel.js";
import { createEmbed } from "@/utils/create-embed.js";
import logger from "../logger.js";
import { getNoun } from "../functions.js";

export const data = {
	name: "birthdays",
	task: async () => {
		const client = useClient();

		const guilds = client.guilds.cache.values();
		const users = await client.adapter.find(User, {
			birthdate: { $ne: null },
		});

		const currentData = new Date();
		const currentYear = currentData.getFullYear();
		const currentMonth = currentData.getMonth();
		const currentDate = currentData.getDate();

		for (const guild of guilds) {
			try {
				const data = await client.getGuildData(guild.id);
				const channel = data.plugins.birthdays
					? await client.channels.fetch(data.plugins.birthdays)
					: null;
				const channel = data.plugins.birthdays
					? await client.channels.fetch(data.plugins.birthdays)
					: null;

				if (!channel) return;

				if (!channel.isSendable()) return;

				const userIDs = users.filter(u => guild.members.cache.has(u.id)).map(u => u.id);

				await Promise.all(
					userIDs.map(async userID => {
						const user = users.find(u => u.id === userID);
						if (!user) return;

						const userData =
							new Date(user.birthdate!).getFullYear() <= 1970
								? new Date(user.birthdate! * 1000)
								: new Date(user.birthdate!);
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
												age: `**${age}** ${getNoun(age, [
													client.i18n.translate("misc:NOUNS:AGE:1",
														data.language,
													),
													client.i18n.translate("misc:NOUNS:AGE:2",
														data.language,
													),
													client.i18n.translate("misc:NOUNS:AGE:5",
														data.language,
													),
												])}`,
											},
										),
									},
								],
							});

							await channel.send({ embeds: [embed] }).then(m => m.react(" "));
						}
					}),
				);
			} catch (error) {
				logger.error(error);
			}
		}
	},
	schedule: "0 5 * * *",
};
