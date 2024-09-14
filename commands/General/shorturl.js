const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Shorturl extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
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
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
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
		await interaction.deferReply({ ephemeral: true });

		const url = interaction.options.getString("url");
		const res = await fetch("https://i.jonnybro.ru/api/shorten", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: client.config.apiKeys.zipline,
			},
			body: JSON.stringify({ url: url }),
		}).then(res => res.json());

		console.log(res);

		interaction.editReply({
			content: `<${res.url}>`,
		});
	}
}

module.exports = Shorturl;
