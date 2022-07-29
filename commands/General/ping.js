const { SlashCommandBuilder } = require("@discordjs/builders");
const BaseCommand = require("../../base/BaseCommand");

class Ping extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("ping")
				.setDescription(client.translate("general/ping:DESCRIPTION")),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
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
	 * @param {import("discord.js").CommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		interaction.replyT("general/ping:CONTENT", {
			ping: Math.round(client.ws.ping)
		});
	}
}

module.exports = Ping;