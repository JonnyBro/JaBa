const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Autorole extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("autorole")
				.setDescription(client.translate("administration/autorole:DESCRIPTION"))
				.setDescriptionLocalizations({
					"uk": client.translate("administration/autorole:DESCRIPTION", null, "uk-UA"),
					"ru": client.translate("administration/autorole:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addBooleanOption(option => option.setName("state")
					.setDescription(client.translate("common:STATE"))
					.setDescriptionLocalizations({
						"uk": client.translate("common:STATE", null, "uk-UA"),
						"ru": client.translate("common:STATE", null, "ru-RU"),
					})
					.setRequired(true))
				.addRoleOption(option => option.setName("role")
					.setDescription(client.translate("common:ROLE"))
					.setDescriptionLocalizations({
						"uk": client.translate("common:ROLE", null, "uk-UA"),
						"ru": client.translate("common:ROLE", null, "ru-RU"),
					})),
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
	async execute(client, interaction, data) {
		const state = interaction.options.getBoolean("state");

		if (state) {
			const role = interaction.options.getRole("role");
			if (!role) return interaction.error("administration/autorole:MISSING_ROLE");

			data.guildData.plugins.autorole = {
				enabled: true,
				role: role.id,
			};
			data.guildData.markModified("plugins.autorole");
			await data.guildData.save();

			interaction.success("administration/autorole:SUCCESS_ENABLED", {
				role: role.toString(),
			});
		} else {
			data.guildData.plugins.autorole = {
				enabled: false,
				role: null,
			};
			data.guildData.markModified("plugins.autorole");
			await data.guildData.save();

			interaction.success("administration/autorole:SUCCESS_DISABLED");
		}
	}
}

module.exports = Autorole;