const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Setbio extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("setbio")
				.setDescription(client.translate("economy/setbio:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/setbio:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/setbio:DESCRIPTION", null, "ru-RU"),
				})
				.setContexts([InteractionContextType.BotDM, InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("text")
						.setDescription(client.translate("economy/profile:BIO"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/profile:BIO", null, "uk-UA"),
							ru: client.translate("economy/profile:BIO", null, "ru-RU"),
						})
						.setRequired(true),
				),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const userData = interaction.data.user,
			newBio = interaction.options.getString("text");
		if (newBio.length > 150) return interaction.error("economy/setbio:MAX_CHARACTERS");

		userData.bio = newBio;

		await userData.save();

		interaction.success("economy/setbio:SUCCESS", null, { edit: true });
	}
}

module.exports = Setbio;
