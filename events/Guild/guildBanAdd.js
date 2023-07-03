const { EmbedBuilder } = require("discord.js"),
	BaseEvent = require("../../base/BaseEvent");

class guildBanAdd extends BaseEvent {
	constructor() {
		super({
			name: "guildBanAdd",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").GuildBan} ban
	 */
	async execute(client, ban) {
		const embed = new EmbedBuilder()
			.setAuthor({
				name: client.user.getUsername(),
				iconURL: ban.guild.iconURL(),
			})
			.setColor(client.config.embed.color)
			.setFooter({ text: client.config.embed.footer })
			.setDescription(`You were banned from **${ban.guild.name}**!\nReason: **${ban.reason || "Not specified"}**`);

		ban.user.send({
			embeds: [embed],
		});
	}
}

module.exports = guildBanAdd;