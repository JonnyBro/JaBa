const { CronJob } = require("cron"),
	{ EmbedBuilder } = require("discord.js");

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.init = async function (client) {
	const cronjob = new CronJob("0 5 * * *", async function () {
		client.guilds.cache.forEach(async guild => {
			const guildData = await client.findOrCreateGuild(guild.id);

			if (guildData.plugins.birthdays) {
				const channel = guild.channels.cache.get(guildData.plugins.birthdays) || await guild.channels.fetch(guildData.plugins.birthdays),
					date = new Date(),
					currentDay = date.getDate(),
					currentMonth = date.getMonth(),
					currentYear = date.getFullYear();

				if (channel) {
					client.usersData.find({ birthdate: { $gt: 1 } }).then(async users => {
						for (const user of users) {
							if (!guild.members.cache.find(m => m.id === user.id)) return;

							const userDate = new Date(user.birthdate),
								day = userDate.getDate(),
								month = userDate.getMonth(),
								year = userDate.getFullYear(),
								age = currentYear - year;

							if (currentMonth === month && currentDay === day) {
								const embed = new EmbedBuilder()
									.setAuthor({
										name: client.user.getUsername(),
										iconURL: client.user.displayAvatarURL(),
									})
									.setColor(client.config.embed.color)
									.setFooter(client.config.embed.footer)
									.addFields([
										{
											name: client.translate("economy/birthdate:HAPPY_BIRTHDAY", null, guildData.language),
											value: client.translate("economy/birthdate:HAPPY_BIRTHDAY_MESSAGE", {
												name: user.username,
												user: user.id,
												age: `**${age}** ${client.functions.getNoun(age, client.translate("misc:NOUNS:AGE:1", null, guildData.language), client.translate("misc:NOUNS:AGE:2", null, guildData.language), client.translate("misc:NOUNS:AGE:5", null, guildData.language))}`,
											}, guildData.language),
										},
									]);

								const msg = await channel.send({
									embeds: [embed],
								});
								await msg.react("🎉");
							}
						}
					});
				}
			}
		});
	},
	null,
	true,
	);

	cronjob.start();
};
