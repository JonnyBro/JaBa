const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType, escapeEscape, escapeCodeBlock, escapeInlineCode } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Afk extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("afk")
				.setDescription(client.translate("general/afk:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/afk:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/afk:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("message")
						.setDescription(client.translate("common:MESSAGE"))
						.setDescriptionLocalizations({
							uk: client.translate("common:MESSAGE", null, "uk-UA"),
							ru: client.translate("common:MESSAGE", null, "ru-RU"),
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
			message = interaction.options.getString("message");

		if (message.length > 150) return interaction.error("misc:MAX_150_CHARS", null, { edit: true });

		userData.afk = escapeEscape(escapeCodeBlock(escapeInlineCode(message))).replace("@", "@\u200b");

		await userData.save();

		interaction.success("general/afk:SUCCESS", {
			message,
		}, { edit: true });
	}
}

module.exports = Afk;
