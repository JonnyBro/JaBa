const { EmbedBuilder } = require("discord.js"),
	BaseEvent = require("../../base/BaseEvent");

class messageUpdate extends BaseEvent {
	constructor() {
		super({
			name: "messageUpdate",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/JaBa")} client The Discord client
	 * @param {import("discord.js").Message} oldMessage The message before the update
	 * @param {import("discord.js").Message} newMessage The message after the update
	 */
	async execute(client, oldMessage, newMessage) {
		if (oldMessage.guild && oldMessage.guildId === "568120814776614924") return;
		if (oldMessage.author.bot) return;

		if (oldMessage.content === newMessage.content) return;

		const guildData = await client.findOrCreateGuild({ id: oldMessage.guildId });

		if (guildData.plugins?.monitoring?.messageUpdate) {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: newMessage.author.getUsername(),
					iconURL: newMessage.author.displayAvatarURL(),
				})
				.setColor(client.config.embed.color)
				.setFooter(client.config.embed.footer)
				.setTitle(`${newMessage.author.getUsername()} edited a message!`)
				.setDescription(`Old Message: \`\`\`${oldMessage.content}\`\`\`\nNew Message: \`\`\`${newMessage.content}\`\`\`\nJump to message: ${newMessage.url}`);

			newMessage.guild.channels.cache.get(guildData.plugins.monitoring.messageUpdate).send({
				embeds: [embed],
			});
		}
	}
}

module.exports = messageUpdate;
