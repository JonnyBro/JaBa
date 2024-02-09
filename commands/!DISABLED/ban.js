const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Ban extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("ban")
				.setDescription(client.translate("moderation/ban:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("moderation/ban:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("moderation/ban:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName("reason")
						.setDescription(client.translate("common:REASON"))
						.setDescriptionLocalizations({
							uk: client.translate("common:REASON", null, "uk-UA"),
							ru: client.translate("common:REASON", null, "ru-RU"),
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
			reason = interaction.options.getString("reason"),
			memberPosition = member.roles.highest.position,
			moderationPosition = interaction.member.roles.highest.position;

		if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true, edit: true });
		if (member.id === interaction.member.id) return interaction.error("moderation/ban:YOURSELF", null, { ephemeral: true, edit: true });
		if (interaction.guild.ownerId !== interaction.member.id && !(moderationPosition > memberPosition) && member.bannable) return interaction.error("moderation/ban:SUPERIOR", null, { ephemeral: true, edit: true });

		await member.ban({
			reason,
		});

		interaction.success("moderation/ban:SUCCESS", {
			user: member.user.toString(),
			reason,
		}, { edit: true });
	}
}

module.exports = Ban;
