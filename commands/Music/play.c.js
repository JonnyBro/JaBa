const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionsBitField } = require("discord.js");
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
				.setDMPermission(false),
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
	 * @param {import("discord.js").MessageContextMenuCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const query = interaction.targetMessage.content.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g)[0],
			voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { edit: true });

		const perms = voice.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT", null, { edit: true });

		const searchResult = await client.player.search(query, {
			requestedBy: interaction.user,
		});

		if (!searchResult.hasTracks()) return interaction.error("music/play:NO_RESULT", { query }, { edit: true });
		else {
			const { queue } = await client.player.play(interaction.member.voice.channel, searchResult, {
				nodeOptions: {
					metadata: {
						channel: interaction.channel,
						requestedBy: interaction.user,
					},
				},
				selfDeaf: true,
				leaveOnEnd: false,
				leaveOnStop: true,
				skipOnNoStream: true,
				maxSize: 200,
				maxHistorySize: 50,
			});

			interaction.editReply({
				content: interaction.translate("music/play:ADDED_QUEUE", {
					songName: searchResult.hasPlaylist() ? searchResult.playlist.title : searchResult.tracks[0].title,
				}),
			});

			if (client.player.nodes.get(interaction.guildId).currentTrack.url === query && query.match(/&t=[[0-9]+/g) !== null) {
				const time = query.match(/&t=[[0-9]+/g)[0].split("=")[1];

				queue.node.seek(time * 1000);
			}
		}
	}
}

module.exports = PlayContext;
