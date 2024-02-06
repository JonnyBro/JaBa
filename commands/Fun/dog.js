const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Dog extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("dog")
				.setDescription(client.translate("fun/dog:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("fun/dog:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("fun/dog:DESCRIPTION", null, "ru-RU"),
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
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const res = await fetch("https://dog.ceo/api/breeds/image/random").then(r => r.json());
		const dog = res.message;

		const embed = client.embed({
			image: dog,
		});

		await interaction.editReply({ embeds: [embed] });
	}
}

module.exports = Dog;
