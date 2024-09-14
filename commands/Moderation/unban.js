const { SlashCommandBuilder, PermissionsBitField, InteractionContextType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Unban extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("unban")
				.setDescription(client.translate("moderation/unban:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("moderation/unban:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("moderation/unban:DESCRIPTION", null, "ru-RU"),
				})
				.setContexts([InteractionContextType.Guild])
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
				.addStringOption(option =>
					option
						.setName("user_id")
						.setDescription(client.translate("common:USER_ID"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER_ID", null, "uk-UA"),
							ru: client.translate("common:USER_ID", null, "ru-RU"),
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
		const id = interaction.options.getString("user_id"),
			banned = await interaction.guild.bans.fetch();

		if (!banned.find(u => u.user.id === id)) return interaction.error("moderation/unban:NOT_BANNED", { id });

		await interaction.guild.bans.remove(id);

		interaction.success("moderation/unban:UNBANNED", {
			id,
		});
	}
}

module.exports = Unban;
