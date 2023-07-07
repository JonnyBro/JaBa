const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Adduser extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("adduser")
				.setDescription(client.translate("tickets/adduser:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("tickets/adduser:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("tickets/adduser:DESCRIPTION", null, "ru-RU"),
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
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
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
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const member = interaction.options.getMember("user");

		if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true, edit: true });
		if (!interaction.channel.name.includes("support") && !interaction.channel.name.includes("application")) return interaction.error("tickets/adduser:NOT_TICKET", null, { ephemeral: true, edit: true });

		await interaction.channel.permissionOverwrites.edit(member, { ViewChannel: true, SendMessages: true });

		interaction.success("tickets/adduser:SUCCESS", {
			user: member.user.toString(),
		}, { edit: true });
	}
}

module.exports = Adduser;
