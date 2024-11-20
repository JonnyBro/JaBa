const { CronJob } = require("cron");

/**
 *
 * @param {import("../base/Client")} client
 */
async function checkBirthdays(client) {
	for (const guild of client.guilds.cache.values()) {
		try {
			const guildData = await client.getGuildData(guild.id);
			const channel = guildData.plugins.birthdays ? await client.channels.fetch(guildData.plugins.birthdays) : null;

			if (channel) {
				const date = new Date();
				const currentDay = date.getDate();
				const currentMonth = date.getMonth() + 1;
				const currentYear = date.getFullYear();

				const users = await client.usersData.find({ birthdate: { $gt: 1 } });

				for (const user of users) {
					if (!guild.members.cache.has(user.id)) continue;

					const userDate = new Date(user.birthdate).getFullYear() <= 1970 ? new Date(user.birthdate * 1000) : new Date(user.birthdate);
					const day = userDate.getDate();
					const month = userDate.getMonth() + 1;
					const year = userDate.getFullYear();
					const age = currentYear - year;

					if (currentMonth === month && currentDay === day) {
						const embed = client.embed({
							author: client.user.getUsername(),
							fields: [
								{
									name: client.translate("economy/birthdate:HAPPY_BIRTHDAY", null, guildData.language),
									value: client.translate(
										"economy/birthdate:HAPPY_BIRTHDAY_MESSAGE",
										{
											user: user.id,
											age: `**${age}** ${client.functions.getNoun(
												age,
												client.translate("misc:NOUNS:AGE:1", null, guildData.language),
												client.translate("misc:NOUNS:AGE:2", null, guildData.language),
												client.translate("misc:NOUNS:AGE:5", null, guildData.language),
											)}`,
										},
										guildData.language,
									),
								},
							],
						});

						await channel.send({ embeds: [embed] }).then(m => m.react("🎉"));
					}
				}
			}
		} catch (e) {
			if (e.code === 10003) console.log(`No channel found for ${guild.name}`);
			else console.error(`Error processing birthdays for guild "${guild.name}":`, e);
		}
	}
}

module.exports.init = async client => new CronJob("0 5 * * *", checkBirthdays(client), null, true, "Europe/Moscow");
module.exports.run = async client => await checkBirthdays(client);
