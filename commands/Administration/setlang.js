const { SlashCommandBuilder, PermissionsBitField, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Setlang extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("setlang")
				.setDescription(client.translate("administration/setlang:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("administration/setlang:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("administration/setlang:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addStringOption(option =>
					option
						.setName("language")
						.setDescription(client.translate("common:LANGUAGE"))
						.setDescriptionLocalizations({
							uk: client.translate("common:LANGUAGE", null, "uk-UA"),
							ru: client.translate("common:LANGUAGE", null, "ru-RU"),
						})
						.setRequired(true)
						.setChoices({ name: "English", value: "en-US" }, { name: "Русский", value: "ru-RU" }, { name: "Українська", value: "uk-UA" }),
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
		const guildData = interaction.data.guild,
			lang = interaction.options.getString("language"),
			language = client.languages.find(l => l.name === lang);

		guildData.language = language.name;

		await guildData.save();

		return interaction.success("administration/setlang:SUCCESS", {
			lang: language.nativeName,
		});
	}
}

module.exports = Setlang;
