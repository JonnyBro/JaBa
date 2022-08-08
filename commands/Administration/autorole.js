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
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addBooleanOption(option => option.setName("state")
					.setDescription(client.translate("common:STATE"))
					.setRequired(true))
				.addRoleOption(option => option.setName("role")
					.setDescription(client.translate("common:ROLE"))),
			aliases: [],
			dirname: __dirname,
			guildOnly: true
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
	 * @param {Array} data
	 */
	async execute(client, interaction, data) {
		const state = interaction.options.getBoolean("state");

		if (state) {
			const role = interaction.options.getRole("role", true);
			if (!role) return interaction.error("administration/autorole:MISSING_ROLE");

			data.guildData.plugins.autorole = {
				enabled: true,
				role: role.id
			};
			data.guildData.markModified("plugins.autorole");
			await data.guildData.save();

			interaction.success("administration/autorole:SUCCESS_ENABLED", {
				roleName: role.name
			});
		} else {
			if (!data.guildData.plugins.autorole.enabled) return interaction.success("administration/autorole:ALREADY_DISABLED", {
				prefix: data.guildData.prefix
			});

			data.guildData.plugins.autorole = {
				enabled: false,
				role: null
			};
			data.guildData.markModified("plugins.autorole");
			await data.guildData.save();

			interaction.success("administration/autorole:SUCCESS_DISABLED", {
				prefix: data.guildData.prefix
			});
		}
	}
}

module.exports = Autorole;