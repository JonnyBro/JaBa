const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Setlang extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("setlang")
				.setDescription(client.translate("administration/setlang:DESCRIPTION"))
				.setDescriptionLocalizations({
					"uk": client.translate("administration/setlang:DESCRIPTION", null, "uk-UA"),
					"ru": client.translate("administration/setlang:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addStringOption(option => option.setName("language")
					.setDescription(client.translate("common:LANGUAGE"))
					.setDescriptionLocalizations({
						"uk": client.translate("common:LANGUAGE", null, "uk-UA"),
						"ru": client.translate("common:LANGUAGE", null, "ru-RU"),
					})
					.setRequired(true)
					.setChoices(
						{ name: "English", value: "en-US" },
						{ name: "Русский", value: "ru-RU" },
						{ name: "Українська", value: "uk-UA" },
					)),
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
		const lang = interaction.options.getString("language"),
			language = client.languages.find(l => l.name === lang);

		data.guildData.language = language.name;
		data.guildData.markModified("language");
		await data.guildData.save();

		return interaction.success("administration/setlang:SUCCESS", {
			lang: language.nativeName,
		});
	}
}

module.exports = Setlang;