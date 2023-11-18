const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class LMGTFY extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("lmgtfy")
				.setDescription(client.translate("fun/lmgtfy:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("fun/lmgtfy:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("fun/lmgtfy:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true)
				.addStringOption(option =>
					option
						.setName("query")
						.setDescription(client.translate("fun/lmgtfy:QUERY"))
						.setDescriptionLocalizations({
							uk: client.translate("fun/lmgtfy:QUERY", null, "uk-UA"),
							ru: client.translate("fun/lmgtfy:QUERY", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addBooleanOption(option =>
					option
						.setName("short")
						.setDescription(client.translate("fun/lmgtfy:SHORT"))
						.setDescriptionLocalizations({
							uk: client.translate("fun/lmgtfy:SHORT", null, "uk-UA"),
							ru: client.translate("fun/lmgtfy:SHORT", null, "ru-RU"),
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
		await interaction.deferReply({ ephemeral: true });

		const query = interaction.options.getString("query").replace(/[' '_]/g, "+"),
			short = interaction.options.getBoolean("short"),
			url = `https://letmegooglethat.com/?q=${encodeURIComponent(query)}`;

		if (short) {
			const res = await fetch(`https://plsgo.ru/yourls-api.php?signature=${client.config.apiKeys.jababot_yourls}&action=shorturl&url=${encodeURIComponent(url)}&format=json`).then(res => res.json());

			interaction.editReply({
				content: `<${res.shorturl}>`,
			});
		} else {
			interaction.editReply({
				content: `<${url}>`,
			});
		}
	}
}

module.exports = LMGTFY;
