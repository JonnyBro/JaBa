import BaseEvent from "../../base/BaseEvent";

class messageUpdate extends BaseEvent {
	constructor() {
		super({
			name: "messageUpdate",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client The Discord client
	 * @param {import("discord.js").Message} oldMessage The message before the update
	 * @param {import("discord.js").Message} newMessage The message after the update
	 */
	async execute(client, oldMessage, newMessage) {
		if (oldMessage.author.bot) return;
		if (oldMessage.content === newMessage.content) return;

		const guildData = newMessage.data.guild;

		if (guildData.plugins?.monitoring?.messageUpdate) {
			const embed = client.embed({
				author: {
					name: newMessage.author.getUsername(),
					iconURL: newMessage.author.displayAvatarURL(),
				},
				title: newMessage.translate("misc:MONITORING:UPDATE:TITLE", { user: newMessage.author.getUsername() }),
				description: newMessage.translate("misc:MONITORING:UPDATE:DESCRIPTION", {
					oldContent: oldMessage.content,
					newContent: newMessage.content,
					url: newMessage.url,
				}),
			});

			const monitoringChannelId = guildData.plugins.monitoring.messageUpdate;
			const monitoringChannel = newMessage.guild.channels.cache.get(monitoringChannelId);

			if (monitoringChannel) await monitoringChannel.send({ embeds: [embed] });
		}
	}
}

export default messageUpdate;
