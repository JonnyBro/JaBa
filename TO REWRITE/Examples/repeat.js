const { ApplicationCommandType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Repeat extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor() {
		super({
			command: {
				name: "repeat",
				type: ApplicationCommandType.Message
			},
			aliases: [],
			dirname: __dirname,
			guildOnly: true
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ContextMenuInteraction} interaction
	 */
	async execute(client, interaction) {
		const targetChannel = interaction.member.guild.channels.cache.get(interaction.channelId);
		const targetMessage = await targetChannel.messages.fetch(interaction.targetId);
		return interaction.reply({ content: targetMessage.content, ephemeral: false, fetchReply: true }).then(m => setTimeout(() => m.delete(), 5000));
	}
}
module.exports = Repeat;