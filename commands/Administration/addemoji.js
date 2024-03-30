const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Addemoji extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("addemoji")
				.setDescription(client.translate("administration/addemoji:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("administration/addemoji:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("administration/addemoji:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addStringOption(option =>
					option
						.setName("link")
						.setDescription(client.translate("common:LINK"))
						.setDescriptionLocalizations({
							uk: client.translate("common:LINK", null, "uk-UA"),
							ru: client.translate("common:LINK", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName("name")
						.setDescription(client.translate("common:NAME"))
						.setDescriptionLocalizations({
							uk: client.translate("common:NAME", null, "uk-UA"),
							ru: client.translate("common:NAME", null, "ru-RU"),
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
		const link = interaction.options.getString("link"),
			name = interaction.options.getString("name");

		interaction.guild.emojis
			.create({
				name: name,
				attachment: link,
			})
			.then(emoji =>
				interaction.success("administration/stealemoji:SUCCESS", {
					emoji: emoji.name,
				}, { ephemeral: true }),
			)
			.catch(e => {
				interaction.error("administration/stealemoji:ERROR", {
					emoji: name,
					e,
				}, { ephemeral: true });
			});
	}
}

module.exports = Addemoji;
