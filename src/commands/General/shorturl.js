const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Shorturl extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("shorturl")
				.setDescription(client.translate("general/shorturl:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/shorturl:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/shorturl:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("url")
						.setDescription(client.translate("common:URL"))
						.setDescriptionLocalizations({
							uk: client.translate("common:URL", null, "uk-UA"),
							ru: client.translate("common:URL", null, "ru-RU"),
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

		const url = interaction.options.getString("url");
		if (!url.startsWith("http")) return interaction.error("general/shorturl:NOT_A_LINK", null, { edit: true });

		const res = await fetch("https://s.jonnybro.ru/api/link/create", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${client.config.apiKeys.sink}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ url: url }),
		}).then(res => res.json());

		interaction.editReply({
			content: `<${res.shortLink}>`,
		});
	}
}

module.exports = Shorturl;
