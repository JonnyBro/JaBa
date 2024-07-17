const BaseEvent = require("../../base/BaseEvent");

class messageDelete extends BaseEvent {
	constructor() {
		super({
			name: "messageDelete",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client The Discord Client
	 * @param {import("discord.js").Message} message The deleted message
	 */
	async execute(client, message) {
		if (message.guild && message.guildId === "568120814776614924") return;
		if (message.author.bot) return;

		const guildData = message.data.guild;

		if (guildData.plugins?.monitoring?.messageDelete) {
			await client.wait(1000);

			const logs = await message.guild.fetchAuditLogs({
				limit: 5,
				type: "MESSAGE_DELETE",
			});

			const deletedMessage = logs.entries.find(e => e.targetId === message.author.id && e.extra.channel.id && Date.now() - e.createdTimestamp < 20000);

			const embed = client.embed({
				author: {
					name: message.author.getUsername(),
					iconURL: message.author.displayAvatarURL(),
				},
				title: message.translate("misc:MONITORING:DELETE:TITLE", { user: message.author.getUsername() }),
				description: message.translate("misc:MONITORING:DELETE:DESCRIPTION", { deletedBy: deletedMessage.executor ? deletedMessage.executor.toString() : "Unknown", content: message.content, channel: message.channel.toString(), time: `<t:${Math.floor(message.createdTimestamp / 1000)}:f>` }),
			});

			message.guild.channels.cache.get(guildData.plugins.monitoring.messageDelete).send({
				embeds: [embed],
			});
		}
	}
}

module.exports = messageDelete;
