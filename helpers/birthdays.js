const CronJob = require("cron").CronJob,
	Discord = require("discord.js");

async function init(client) {
	new CronJob("0 8 * * *", async function () {
		client.guilds.cache.forEach(async (guild) => {
			const date = new Date();
			const currentDay = date.getDate();
			const currentMonth = date.getMonth();
			const currentYear = date.getFullYear();
			const guildData = await client.findOrCreateGuild({
				id: guild.id
			});

			if (guildData.plugins.birthdays) {
				const channel = client.channels.cache.get(guildData.plugins.birthdays);
				if (channel) {
					client.usersData
						.find({ birthdate: { $gt: 1 } })
						.then(async (users) => {
							for (const user of users) {
								const userDate = new Date(user.birthdate);
								const day = userDate.getDate();
								const month = userDate.getMonth();
								const year = userDate.getFullYear();
								const age = currentYear - year;

								if (currentMonth === month && currentDay === day) {
									const embed = new Discord.MessageEmbed()
										.setAuthor(client.user.username, client.user.displayAvatarURL({
											size: 512,
											dynamic: true,
											format: "png"
										}))
										.setColor(client.config.embed.color)
										.setFooter(client.config.embed.footer)
										.addField(client.translate("economy/birthdate:HAPPY_BIRTHDAY"), client.translate("economy/birthdate:HAPPY_BIRTHDAY_MESSAGE", {
											user: user.id,
											age: `${age} ${client.getNoun(age, message.translate("misc:NOUNS:AGE:1"), message.translate("misc:NOUNS:AGE:2"), message.translate("misc:NOUNS:AGE:5"))}`
										}));
									const msg = await channel.send("@everyone", { embed });
									await msg.react("🎉");
								};
							};
						});
				};
			};
		});
	}, null, true, "Europe/Moscow");
};

module.exports = { init };