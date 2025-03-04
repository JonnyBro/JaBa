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

			const logChannel = client.channels.cache.get(client.config.support.logs);

			if (logChannel)
				await logChannel.send({
					embeds: [embed],
				});
			else client.logger.warn(`Log channel not found for guild deletion: ${guild.name}`);
		}
	}
}

module.exports = GuildDelete;
