const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Ping extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("ping")
				.setDescription(client.translate("general/ping:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/ping:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/ping:DESCRIPTION", null, "ru-RU"),
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
		const embed = client.embed({
			author: {
				name: interaction.translate("general/ping:PONG"),
			},
			description: interaction.translate("general/ping:PING", {
				ping: Math.round(client.ws.ping),
			}),
		});

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Ping;
