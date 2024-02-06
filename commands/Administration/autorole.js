const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Autorole extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("autorole")
				.setDescription(client.translate("administration/autorole:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("administration/autorole:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("administration/autorole:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addBooleanOption(option =>
					option
						.setName("state")
						.setDescription(client.translate("common:STATE"))
						.setDescriptionLocalizations({
							uk: client.translate("common:STATE", null, "uk-UA"),
							ru: client.translate("common:STATE", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addRoleOption(option =>
					option
						.setName("role")
						.setDescription(client.translate("common:ROLE"))
						.setDescriptionLocalizations({
							uk: client.translate("common:ROLE", null, "uk-UA"),
							ru: client.translate("common:ROLE", null, "ru-RU"),
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
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		const state = interaction.options.getBoolean("state"),
			role = interaction.options.getRole("role");

		data.guildData.plugins.autorole = {
			enabled: state,
			role,
		};

		if (state && role) {
			data.guildData.markModified("plugins.autorole");
			await data.guildData.save();

			interaction.success("administration/autorole:ENABLED", {
				role: role.toString(),
			});
		} else {
			data.guildData.plugins.autorole.enabled = false;

			data.guildData.markModified("plugins.autorole");
			await data.guildData.save();

			interaction.success("administration/autorole:DISABLED");
		}
	}
}

module.exports = Autorole;
