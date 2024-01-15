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
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
		});
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const res = await fetch("https://and-here-is-my-code.glitch.me/img/dog").then(response => response.json());

		interaction.editReply({
			content: res.Link,
		});
	}
}

module.exports = Dog;
