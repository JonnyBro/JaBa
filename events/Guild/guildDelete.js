const BaseEvent = require("../../base/BaseEvent");

class GuildDelete extends BaseEvent {
	constructor() {
		super({
			name: "guildDelete",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").Guild} guild
	 */
	async execute(client, guild) {
		if (client.config.support.logs) {
			const embed = client.embed({
				author: {
					name: guild.name,
					iconURL: guild.iconURL() || client.user.avatarURL(),
				},
				description: `Left from guild **${guild.name}**.`,
			});

			client.channels.cache.get(client.config.support.logs).send({
				embeds: [embed],
			});
		}
	}
}

module.exports = GuildDelete;
