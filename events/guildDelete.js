const Discord = require("discord.js");

module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run(guild) {
		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL({
					dynamic: true
				})
			})
			.setColor("#B22222")
			.setDescription(`Вышел с сервера **${guild.name}**. На нём **${guild.members.cache.filter((m) => !m.user.bot).size}** пользователей (из них ${guild.members.cache.filter((m) => m.user.bot).size} ботов)`);
		this.client.channels.cache.get(this.client.config.support.logs).send({
			embeds: [embed]
		});
	}
};