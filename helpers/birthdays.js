const { CronJob } = require("cron"),
	{ EmbedBuilder } = require("discord.js");

/**
 *
 * @param {import("../base/JaBa")} client
 */
module.exports.init = async function (client) {
	new CronJob("0 5 * * *", async function () {
		const date = new Date(),
			currentDay = date.getDate(),
			currentMonth = date.getMonth(),
			currentYear = date.getFullYear();

		client.guilds.cache.forEach(async guild => {
			const guildData = await client.findOrCreateGuild({
				id: guild.id
			});

			if (guildData.plugins.birthdays) {
				const channel = client.channels.cache.get(guildData.plugins.birthdays);
				if (channel) {
					client.usersData.find({ birthdate: { $gt: 1 } })
						.then(async users => {
							for (const user of users) {
								if (guild.members.cache.find(m => m.id === user.id)) {
									const userDate = new Date(user.birthdate);
									const day = userDate.getDate();
									const month = userDate.getMonth();
									const year = userDate.getFullYear();
									const age = currentYear - year;

									if (currentMonth === month && currentDay === day) {
										const embed = new EmbedBuilder()
											.setAuthor({
												name: client.user.username,
												iconURL: client.user.displayAvatarURL({
													extension: "png",
													size: 512
												})
											})
											.setColor(client.config.embed.color)
											.setFooter({
												text: client.config.embed.footer
											})
											.addFields([
												{
													name: client.translate("economy/birthdate:HAPPY_BIRTHDAY"),
													value: client.translate("economy/birthdate:HAPPY_BIRTHDAY_MESSAGE", {
														name: user.username,
														user: user.id,
														age: `**${age}** ${client.getNoun(age, client.translate("misc:NOUNS:AGE:1"), client.translate("misc:NOUNS:AGE:2"), client.translate("misc:NOUNS:AGE:5"))}`
													})
												}
											]);

										const msg = await channel.send({
											embeds: [embed]
										});
										await msg.react("🎉");
									}
								}
							}
						});
				}
			}
		});
	}, null, true, "Europe/Moscow");
};