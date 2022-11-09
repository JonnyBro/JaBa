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
				.setDMPermission(true)
				.addStringOption(option => option.setName("url")
					.setDescription(client.translate("general/shorturl:URL"))
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false
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
		const res = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`).then(res => res.text());

		interaction.reply({
			content: `<${res}>`,
			ephemeral: true
		});
	}
}

module.exports = Shorturl;