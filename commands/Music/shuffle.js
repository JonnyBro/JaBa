const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Shuffle extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("shuffle")
				.setDescription(client.translate("music/shuffle:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("music/shuffle:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/shuffle:DESCRIPTION", null, "ru-RU"),
				})
				.setContexts([InteractionContextType.PrivateChannel, InteractionContextType.Guild]),
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
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { ephemeral: true });

		const queue = client.player.nodes.get(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { ephemeral: true });

		queue.tracks.shuffle();
		interaction.success("music/shuffle:SUCCESS");
	}
}

module.exports = Shuffle;
