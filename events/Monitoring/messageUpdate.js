const BaseEvent = require("../../base/BaseEvent");

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
		if (oldMessage.guild && oldMessage.guildId === "568120814776614924") return;
		if (oldMessage.author.bot) return;

		if (oldMessage.content === newMessage.content) return;

		const guildData = await client.findOrCreateGuild(oldMessage.guildId);

		if (guildData.plugins?.monitoring?.messageUpdate) {
			const embed = client.embed({
				author: {
					name: newMessage.author.getUsername(),
					iconURL: newMessage.author.displayAvatarURL(),
				},
				title: `${newMessage.author.getUsername()} edited a message!`,
				description: `Old Message: \`\`\`${oldMessage.content}\`\`\`\nNew Message: \`\`\`${newMessage.content}\`\`\`\nJump to message: ${newMessage.url}`,
			});

			newMessage.guild.channels.cache.get(guildData.plugins.monitoring.messageUpdate).send({
				embeds: [embed],
			});
		}
	}
}

module.exports = messageUpdate;
