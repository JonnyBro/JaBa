const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Ping extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("ping")
				.setDescription(client.translate("general/ping:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/ping:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/ping:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
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

		const embed = client.embed({
			author: {
				name: interaction.translate("general/ping:PONG"),
			},
			description: interaction.translate("general/ping:PING", {
				ping: Math.round(client.ws.ping),
			}),
		});

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Ping;
