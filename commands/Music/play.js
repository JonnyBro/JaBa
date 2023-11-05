const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Play extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("play")
				.setDescription(client.translate("music/play:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("music/play:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/play:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addStringOption(option =>
					option
						.setName("query")
						.setDescription(client.translate("music/play:QUERY"))
						.setDescriptionLocalizations({
							uk: client.translate("music/play:QUERY", null, "uk-UA"),
							ru: client.translate("music/play:QUERY", null, "ru-RU"),
						})
						.setRequired(true)
						.setAutocomplete(true),
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
		await interaction.deferReply();

		const query = interaction.options.getString("query"),
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

			// TODO: Seeks currently playing D:
			if (query.match(/&t=[[0-9]+/g) !== null) {
				const time = query.match(/&t=[[0-9]+/g)[0].split("=")[1];

				queue.node.seek(time * 1000);
			}
		}
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").AutocompleteInteraction} interaction
	 * @returns
	 */
	async autocompleteRun(client, interaction) {
		const query = interaction.options.getString("query");

		if (query === "") return;
		if (query.startsWith("http")) return interaction.respond([
			{
				name: "Current link",
				value: query,
			},
		]);

		const results = await client.player.search(query);

		return interaction.respond(
			results.tracks.slice(0, 10).map(track => ({
				name: (`${track.author} - ${track.title}`.length >= 100) & (`${track.author} - ${track.title}`.slice(0, 80) + "...") || `${track.author} - ${track.title}`,
				value: track.url,
			})),
		);
	}
}

module.exports = Play;
