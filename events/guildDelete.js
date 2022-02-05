const Discord = require("discord.js");

module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run(guild) {
		const users = guild.members.cache.filter((m) => !m.user.bot).size;
		const bots = guild.members.cache.filter((m) => m.user.bot).size;

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL({
					dynamic: true
				})
			})
			.setColor("#B22222")
			.setDescription(`Вышел с сервера **${guild.name}**. На нём **${users}** ${this.client.getNoun(users, this.client.translate("misc:NOUNS:MEMBERS:1"), this.client.translate("misc:NOUNS:MEMBERS:2"), this.client.translate("misc:NOUNS:MEMBERS:5"))} (из них **${bots}** ${this.client.getNoun(bots, this.client.translate("misc:NOUNS:BOTS:1"), this.client.translate("misc:NOUNS:BOTS:2"), this.client.translate("misc:NOUNS:BOTS:5"))})`);
		this.client.channels.cache.get(this.client.config.support.logs).send({
			embeds: [embed]
		});
	}
};