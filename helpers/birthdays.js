const { CronJob } = require("cron");

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.init = async client => {
	const cronjob = new CronJob("0 5 * * *", async function () {
		client.guilds.cache.forEach(async guild => {
			try {
				console.log(`Checking birthdays for "${guild.name}"`);

				const guildData = await client.getGuildData(guild.id);
				const channel = guildData.plugins.birthdays ? await client.channels.fetch(guildData.plugins.birthdays) : null;

				if (channel) {
					const date = new Date(),
						currentDay = date.getDate(),
						currentMonth = date.getMonth() + 1,
						currentYear = date.getFullYear();

					client.usersData.find({ birthdate: { $gt: 1 } }).then(async users => {
						for (const user of users) {
							if (!guild.members.cache.find(m => m.id === user.id)) return;

							const userDate = new Date(user.birthdate * 1000),
								day = userDate.getDate(),
								month = userDate.getMonth() + 1,
								year = userDate.getFullYear(),
								age = currentYear - year;

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

								channel.send({
									embeds: [embed],
								}).then(m => m.react("🎉"));
							}
						}
					});
				}
			} catch (err) {
				if (err.code === 10003) console.log(`No channel found for ${guild.name}`);
				else throw err;
			}
		});
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
	client.guilds.cache.forEach(async guild => {
		const guildData = await client.getGuildData(guild.id);
		const channel = guildData.plugins.birthdays ? await client.channels.fetch(guildData.plugins.birthdays) : null;

		if (channel) {
			const date = new Date(),
				currentDay = date.getDate(),
				currentMonth = date.getMonth() + 1,
				currentYear = date.getFullYear();

			client.usersData.find({ birthdate: { $gt: 1 } }).then(async users => {
				for (const user of users) {
					if (!guild.members.cache.find(m => m.id === user.id)) return;

					const userDate = new Date(user.birthdate * 1000),
						day = userDate.getDate(),
						month = userDate.getMonth() + 1,
						year = userDate.getFullYear(),
						age = currentYear - year;

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

						channel.send({
							embeds: [embed],
						}).then(m => m.react("🎉"));
					}
				}
			});
		}
	});
};