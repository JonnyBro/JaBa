const BaseCommand = require("../base/BaseCommand");

class Mention extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor() {
		super({
			command: {
				name: "mention",
				type: 2 // Type 2 is MESSAGE COMMAND.
			},
			aliases: ["m"], // Application command aliases.
			guildOnly: true // Determines whether your command is only guild.
		});
	}
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 * @param {import("discord.js").ContextMenuInteraction} interaction
	 */
	async execute(client, interaction) {
		const target = interaction.member.guild.members.cache.get(interaction.targetId);
		return interaction.reply({ content: target.toString(), ephemeral: false, fetchReply: true }).then(m => setTimeout(() => m.delete(), 5000));
	}
}
module.exports = Mention;