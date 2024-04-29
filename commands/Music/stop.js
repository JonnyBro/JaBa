const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Stop extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("stop")
				.setDescription(client.translate("music/stop:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("music/stop:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/stop:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
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
		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");

		const player = client.lavalink.getPlayer(interaction.guildId);
		if (!player) return interaction.error("music/play:NOT_PLAYING");

		await player.destroy();
		interaction.success("music/stop:SUCCESS");
	}
}

module.exports = Stop;
