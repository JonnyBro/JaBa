const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Cat extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("cat")
				.setDescription(client.translate("fun/cat:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("fun/cat:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("fun/cat:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true),
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
		await interaction.deferReply();

		const res = await fetch("https://api.thecatapi.com/v1/images/search").then(r => r.json());
		const cat = res[0].url;

		const embed = client.embed({
			image: cat,
		});

		await interaction.editReply({ embeds: [embed] });
	}
}

module.exports = Cat;
