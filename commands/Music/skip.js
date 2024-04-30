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

		const queue = client.player.nodes.get(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		const position = interaction.options.getInteger("position");

		if (position) {
			if (position <= 0) return interaction.error("music/skip:NO_PREV_SONG");

			if (queue.tracks.at(position - 1)) {
				queue.node.skipTo(queue.tracks.at(position - 1));

				interaction.success("music/skip:SUCCESS", {
					track: `${queue.tracks.at(0).title} - ${queue.tracks.at(0).author}`,
				});
			} else return interaction.error("music/skip:ERROR", { position });
		} else {
			queue.node.skip();
			interaction.success("music/skip:SUCCESS", {
				track: `${queue.tracks.at(0).title} - ${queue.tracks.at(0).author}`,
			});
		}
	}
}

module.exports = Skip;
