const { SlashCommandBuilder } = require("@discordjs/builders");
const BaseCommand = require("../../base/BaseCommand");

class Ping extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor() {
		super({
			command: new SlashCommandBuilder()
				.setName("ping")
				.setDescription("Ping command."), // This option is included in type 1. You can configure this option directly with the SlashCommandBuilder feature.
			aliases: ["p"], // Application command aliases.
			dirname: __dirname,
			guildOnly: true // Determines whether your command is only guild.
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
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(client, interaction) {
		return interaction.reply({ content: "Pong!", ephemeral: true });
	}
}
module.exports = Ping;