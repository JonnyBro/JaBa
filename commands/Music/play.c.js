const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionsBitField, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class PlayContext extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor() {
		super({
			command: new ContextMenuCommandBuilder()
				.setName("Add to Queue")
				.setType(ApplicationCommandType.Message)
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild]),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").MessageContextMenuCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const links = interaction.targetMessage.content.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g);
		if (!links) return interaction.error("music/play:NO_LINK", null, { edit: true });

		const query = links[0],
			voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { edit: true });

		const perms = voice.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT", null, { edit: true });

		const searchResult = await client.player.search(query, {
			requestedBy: interaction.user,
		});

		if (!searchResult.hasTracks()) {
			return interaction.error("music/play:NO_RESULT", { query }, { edit: true });
		} else {
			await client.player.play(voice, searchResult, {
				nodeOptions: {
					metadata: interaction,
				},
				selfDeaf: true,
				leaveOnEnd: false,
				leaveOnStop: true,
				skipOnNoStream: true,
				maxSize: 100,
				maxHistorySize: 50,
			});

			interaction.editReply({
				content: interaction.translate("music/play:ADDED_QUEUE", {
					songName: searchResult.hasPlaylist() ? searchResult.playlist.title : searchResult.tracks[0].title,
				}),
			});
		}
	}
}

module.exports = PlayContext;
