const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType, escapeEscape, escapeCodeBlock, escapeInlineCode } = require("discord.js");
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
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
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
				)
				.addBooleanOption(option =>
					option
						.setName("ephemeral")
						.setDescription(client.translate("misc:EPHEMERAL_RESPONSE"))
						.setDescriptionLocalizations({
							uk: client.translate("misc:EPHEMERAL_RESPONSE", null, "uk-UA"),
							ru: client.translate("misc:EPHEMERAL_RESPONSE", null, "ru-RU"),
						}),
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
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral") || false });

		const userData = interaction.data.user,
			newBio = interaction.options.getString("text");
		if (newBio.length > 150) return interaction.error("misc:MAX_150_CHARS", null, { edit: true });

		userData.bio = escapeEscape(escapeCodeBlock(escapeInlineCode(newBio))).replace("@", "@\u200b");

		await userData.save();

		interaction.success("economy/setbio:SUCCESS", null, { edit: true });
	}
}

module.exports = Setbio;
