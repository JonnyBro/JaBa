const Discord = require("discord.js");

module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run(guild) {
		const messageOptions = {};

		const userData = await this.client.findOrCreateUser({
			id: guild.ownerId
		});

		if (!userData.achievements.invite.achieved) {
			userData.achievements.invite.progress.now += 1;
			userData.achievements.invite.achieved = true;
			messageOptions.files = [{
				name: "unlocked.png",
				attachment: "./assets/img/achievements/achievement_unlocked7.png"
			}];
			userData.markModified("achievements.invite");
			await userData.save();
		}

		const thanksEmbed = new Discord.MessageEmbed()
			.setAuthor({
				name: "Спасибо что добавили меня на свой сервер!"
			})
			.setDescription(`Для настроек используйте \`${this.client.config.prefix}help\` и посмотрите на административные команды!\nЧтобы изменить язык используйте \`${this.client.config.prefix}setlang [язык]\`.`)
			.setColor(this.client.config.embed.color)
			.setFooter({
				text: this.client.config.embed.footer
			})
			.setTimestamp();
		messageOptions.embed = thanksEmbed;

		const owner = await guild.fetchOwner();
		owner.send(messageOptions);

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL({
					dynamic: true
				})
			})
			.setColor("#32CD32")
			.setDescription(`Зашёл на сервер **${guild.name}**. На нём **${guild.members.cache.filter((m) => !m.user.bot).size}** пользователей (из них ${guild.members.cache.filter((m) => m.user.bot).size} ботов)`);
		this.client.channels.cache.get(this.client.config.support.logs).send({
			embeds: [embed]
		});
	}
};