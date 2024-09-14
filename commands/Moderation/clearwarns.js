const { SlashCommandBuilder, PermissionsBitField, InteractionContextType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Clearwarns extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("clearwarns")
				.setDescription(client.translate("moderation/clearwarns:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("moderation/clearwarns:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("moderation/clearwarns:DESCRIPTION", null, "ru-RU"),
				})
				.setContexts([InteractionContextType.Guild])
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
		const member = interaction.options.getMember("user");
		if (member.user.id === interaction.user.id) return interaction.error("misc:CANT_YOURSELF");

		const memberData = await client.getMemberData(member.id, interaction.guildId);

		memberData.sanctions = [];

		memberData.markModified("sanctions");
		await memberData.save();

		interaction.success("moderation/clearwarns:SUCCESS", {
			user: member.toString(),
		});
	}
}

module.exports = Clearwarns;
