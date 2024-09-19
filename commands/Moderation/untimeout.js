const { SlashCommandBuilder, PermissionsBitField, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Ban extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("untimeout")
				.setDescription(client.translate("moderation/untimeout:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("moderation/untimeout:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("moderation/untimeout:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
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
		await interaction.deferReply();

		const member = interaction.options.getMember("user"),
			timedout = member.isCommunicationDisabled();

		if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true, edit: true });
		if (member.id === interaction.member.id) return interaction.error("misc:CANT_YOURSELF", null, { ephemeral: true, edit: true });
		if (!timedout) return interaction.error("moderation/untimeout:NOT_TIMEDOUT", null, { ephemeral: true, edit: true });

		await member.timeout(null);

		interaction.success("moderation/untimeout:SUCCESS", {
			user: member.user.toString(),
		}, { edit: true });
	}
}

module.exports = Ban;
