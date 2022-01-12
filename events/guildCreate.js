const Discord = require("discord.js");

module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run(guild) {
		if (this.client.config.proMode) {
			if ((!this.client.config.proUsers.includes(guild.ownerId) || this.guilds.filter((g) => g.ownerId === guild.ownerId) > 1) && guild.ownerId !== this.client.config.owner.id) {
				this.client.logger.log(`${guild.ownerId} tried to invite JaBa on its server.`);
				return guild.leave();
			}
		}

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

		guild.owner.send(messageOptions).catch(() => {});

		const text = `Зашёл на сервер **${guild.name}**. На нём **${guild.members.cache.filter((m) => !m.user.bot).size}** пользователей (из них ${guild.members.cache.filter((m) => m.user.bot).size} ботов)`;

		const logsEmbed = new Discord.MessageEmbed()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL()
			})
			.setColor("#32CD32")
			.setDescription(text);
		this.client.channels.cache.get(this.client.config.support.logs).send(logsEmbed);
	}
};