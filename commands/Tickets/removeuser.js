const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class RemoveUser extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("removeuser")
				.setDescription(client.translate("tickets/removeuser:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("tickets/removeuser:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("tickets/removeuser:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
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

		const member = interaction.options.getMember("user");

		if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true, edit: true });
		if (!interaction.channel.name.includes("support")) return interaction.error("tickets/adduser:NOT_TICKET", null, { ephemeral: true, edit: true });

		await interaction.channel.permissionOverwrites.edit(member, { ViewChannel: false, SendMessages: false });

		interaction.success("tickets/removeuseruser:SUCCESS", {
			user: member.user.toString(),
		}, { edit: true });
	}
}

module.exports = RemoveUser;
