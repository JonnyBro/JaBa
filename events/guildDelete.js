const Discord = require("discord.js");

module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run(guild) {
		const text = `Вышел с сервера **${guild.name}**. На нём **${guild.members.cache.filter((m) => !m.user.bot).size}** пользователей (из них ${guild.members.cache.filter((m) => m.user.bot).size} ботов)`;

		// Sends log embed in the logs channel
		const embed = new Discord.MessageEmbed()
			.setAuthor(guild.name, guild.iconURL())
			.setColor("#B22222")
			.setDescription(text);
		this.client.channels.cache.get(this.client.config.support.logs).send(embed);
	}
};