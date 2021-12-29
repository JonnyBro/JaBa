const CronJob = require("cron").CronJob,
	Discord = require("discord.js");

async function init(client) {
	new CronJob("0 0 8 * * *", async function () {
		client.guilds.cache.forEach(async (guild) => {
			const date = new Date();
			const currentMonth = date.getMonth() + 1;
			const currentDay = date.getDate();
			const guildData = await client.findOrCreateGuild({
				id: guild.id
			});

			if (guildData.plugins.birthdays) {
				const channel = client.channels.cache.get(guildData.plugins.birthdays);
				if (channel) {
					client.usersData
						.find({ birthdate: { $gt: 1 } })
						.then((users) => {
							for (const user of users) {
								const month = user.birthdate.getUTCMonth() + 1;
								const day = user.birthdate.getUTCDate();
								if (currentMonth === month && currentDay === day) {
									const embed = new Discord.MessageEmbed()
										.setAuthor(message.guild.name, message.guild.iconURL())
										.setColor(client.config.embed.color)
										.setFooter(client.config.embed.footer)
										.addField(message.translate("economy/birthdate:HAPPY_BIRTHDAY"), message.translate("economy/birthdate:HAPPY_BIRTDAY_MESSAGE", {
											user: user.id
										}));
									const msg = await channel.send(embed);
									await msg.react("🎉");
								};
							};
						});
				};
			};
		});
	}, null, true, "Europe/Moscow");
};

module.exports = {
	init
};