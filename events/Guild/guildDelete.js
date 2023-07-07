const { EmbedBuilder } = require("discord.js"),
	BaseEvent = require("../../base/BaseEvent");

class GuildDelete extends BaseEvent {
	constructor() {
		super({
			name: "guildDelete",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").Guild} guild
	 */
	async execute(client, guild) {
		const embed = new EmbedBuilder()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL(),
			})
			.setColor(client.config.embed.color)
			.setFooter(client.config.embed.footer)
			.setDescription(`Вышел с сервера **${guild.name}**.`);
		client.channels.cache.get(client.config.support.logs).send({
			embeds: [embed],
		});
	}
}

module.exports = GuildDelete;
