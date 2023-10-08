const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Shorturl extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("shorturl")
				.setDescription(client.translate("general/shorturl:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/shorturl:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/shorturl:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true)
				.addStringOption(option =>
					option
						.setName("url")
						.setDescription(client.translate("common:URL"))
						.setDescriptionLocalizations({
							uk: client.translate("common:URL", null, "uk-UA"),
							ru: client.translate("common:URL", null, "ru-RU"),
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
		const url = interaction.options.getString("url");
		const res = await fetch(`http://jababot.ru/yourls/yourls-api.php?signature=${client.config.apiKeys.jababot_yourls}&action=shorturl&url=${encodeURIComponent(url)}&format=json`).then(res => res.json());

		interaction.reply({
			content: `<${res.shorturl}>`,
			ephemeral: true,
		});
	}
}

module.exports = Shorturl;
