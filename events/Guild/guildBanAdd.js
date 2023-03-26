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
				name: client.user.name,
				iconURL: ban.guild.iconURL(),
			})
			.setColor("#FF0000")
			.setDescription(`Вы были забанены на **${ban.guild.name}** по причине **${ban.reason || "Не указана"}**`);

		ban.user.send({
			embeds: [embed],
		});
	}
}

module.exports = guildBanAdd;