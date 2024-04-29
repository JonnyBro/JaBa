const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Skip extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("skip")
				.setDescription(client.translate("music/skip:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("music/skip:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/skip:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addIntegerOption(option =>
					option
						.setName("position")
						.setDescription(client.translate("music/skip:POSITION"))
						.setDescriptionLocalizations({
							uk: client.translate("music/skip:POSITION", null, "uk-UA"),
							ru: client.translate("music/skip:POSITION", null, "ru-RU"),
						})
						.setRequired(false),
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
		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");

		const player = client.lavalink.getPlayer(interaction.guildId);
		if (!player) return interaction.error("music/play:NOT_PLAYING");

		const position = interaction.options.getInteger("position");

		if (position) {
			if (position <= 0) return interaction.error("music/skip:NO_PREV_SONG");

			if (player.queue.tracks[position]) {
				await player.skip(position);

				return interaction.success("music/skip:SUCCESS", {
					track: player.queue.current.info.title,
				});
			} else return interaction.error("music/skip:ERROR", { position });
		} else {
			await player.skip();
			interaction.success("music/skip:SUCCESS");
		}

	}
}

module.exports = Skip;
