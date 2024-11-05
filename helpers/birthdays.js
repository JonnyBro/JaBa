const { CronJob } = require("cron");

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.init = async client => {
	const cronjob = new CronJob("0 5 * * *",
		async function () {
			// Iterate over all guilds the bot is in
			for (const guild of client.guilds.cache.values()) {
				try {
					console.log(`Checking birthdays for "${guild.name}"`);

					const guildData = await client.getGuildData(guild.id);
					const channel = guildData.plugins.birthdays ? await client.channels.fetch(guildData.plugins.birthdays) : null;

					if (channel) {
						const date = new Date();
						const currentDay = date.getDate();
						const currentMonth = date.getMonth() + 1;
						const currentYear = date.getFullYear();

						const users = await client.usersData.find({ birthdate: { $gt: 1 } });

						for (const user of users) {
							// Check if the user is in the guild
							if (!guild.members.cache.has(user.id)) continue;

							const userDate = user.birthdate > 9999999999 ? new Date(user.birthdate * 1000) : new Date(user.birthdate);
							const day = userDate.getDate();
							const month = userDate.getMonth() + 1;
							const year = userDate.getFullYear();
							const age = currentYear - year;

							// Check if it's the user's birthday
							if (currentMonth === month && currentDay === day) {
								const embed = client.embed({
									author: client.user.getUsername(),
									fields: [
										{
											name: client.translate("economy/birthdate:HAPPY_BIRTHDAY", null, guildData.language),
											value: client.translate("economy/birthdate:HAPPY_BIRTHDAY_MESSAGE", {
												user: user.id,
												age: `**${age}** ${client.functions.getNoun(
													age,
													client.translate("misc:NOUNS:AGE:1", null, guildData.language),
													client.translate("misc:NOUNS:AGE:2", null, guildData.language),
													client.translate("misc:NOUNS:AGE:5", null, guildData.language),
												)}`,
											}, guildData.language),
										},
									],
								});

								await channel.send({ embeds: [embed] }).then(m => m.react("🎉"));
							}
						}
					}
				} catch (err) {
					if (err.code === 10003) console.log(`No channel found for ${guild.name}`);
					else console.error(`Error processing guild "${guild.name}":`, err);
				}
			}
		},
		null,
		true,
	);

	cronjob.start();
};

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.run = async client => {
	for (const guild of client.guilds.cache.values()) {
		const guildData = await client.getGuildData(guild.id);
		const channel = guildData.plugins.birthdays ? await client.channels.fetch(guildData.plugins.birthdays) : null;

		if (channel) {
			const date = new Date();
			const currentDay = date.getDate();
			const currentMonth = date.getMonth() + 1;
			const currentYear = date.getFullYear();

			const users = await client.usersData.find({ birthdate: { $gt: 1 } });

			for (const user of users) {
				// Check if the user is in the guild
				if (!guild.members.cache.has(user.id)) continue;

				const userDate = new Date(user.birthdate * 1000);
				const day = userDate.getDate();
				const month = userDate.getMonth() + 1;
				const year = userDate.getFullYear();
				const age = currentYear - year;

				// Check if it's the user's birthday
				if (currentMonth === month && currentDay === day) {
					const embed = client.embed({
						author: client.user.getUsername(),
						fields: [
							{
								name: client.translate("economy/birthdate:HAPPY_BIRTHDAY", null, guildData.language),
								value: client.translate("economy/birthdate:HAPPY_BIRTHDAY_MESSAGE", {
									user: user.id,
									age: `**${age}** ${client.functions.getNoun(
										age,
										client.translate("misc:NOUNS:AGE:1", null, guildData.language),
										client.translate("misc:NOUNS:AGE:2", null, guildData.language),
										client.translate("misc:NOUNS:AGE:5", null, guildData.language),
									)}`,
								}, guildData.language),
							},
						],
					});

					await channel.send({ embeds: [embed] }).then(m => m.react("🎉"));
				}
			}
		}
	}
};
