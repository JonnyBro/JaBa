const { EmbedBuilder } = require("discord.js"),
	BaseEvent = require("../../base/BaseEvent");

class GuildDelete extends BaseEvent {
	constructor() {
		super({
			name: "guildDelete",
			once: false
		});
	}
	/**
	 *
	 * @param {import("discord.js").Guild} guild
	 */
	async execute(guild) {
		const embed = new EmbedBuilder()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL()
			})
			.setColor("#B22222")
			.setDescription(`Вышел с сервера **${guild.name}**.`);
		this.client.channels.cache.get(this.client.config.support.logs).send({
			embeds: [embed]
		});
	}
}

module.exports = GuildDelete;