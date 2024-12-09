const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Avatar extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("avatar")
				.setDescription(client.translate("general/avatar:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/avatar:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/avatar:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
						}),
				)
				.addBooleanOption(option =>
					option
						.setName("server")
						.setDescription(client.translate("general/avatar:SERVER"))
						.setDescriptionLocalizations({
							uk: client.translate("general/avatar:SERVER", null, "uk-UA"),
							ru: client.translate("general/avatar:SERVER", null, "ru-RU"),
						}),
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

		const user = interaction.guild ? interaction.options.getMember("user") || interaction.member : interaction.options.getUser("user") || interaction.user;
		const avatarURL = interaction.options.getBoolean("server") && interaction.guild ? user.displayAvatarURL({ dynamic: true, extension: "png", size: 2048 }) : user.user.avatarURL({ dynamic: true, extension: "png", size: 2048 });
		const embed = client.embed({ image: avatarURL });

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Avatar;
