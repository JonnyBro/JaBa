const BaseEvent = require("../../base/BaseEvent");

class guildBanAdd extends BaseEvent {
	constructor() {
		super({
			name: "guildBanAdd",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").GuildBan} ban
	 */
	async execute(client, ban) {
		const embed = client.embed({
			author: {
				name: client.user.getUsername(),
				iconURL: ban.guild.iconURL(),
			},
			description: `You were banned from **${ban.guild.name}**!\nReason: **${ban.reason || "Not specified"}**`,
		});

		try {
			ban.user.send({
				embeds: [embed],
			});
		} catch (e) { /**/ }
	}
}

module.exports = guildBanAdd;
