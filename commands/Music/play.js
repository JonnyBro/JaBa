const { SlashCommandBuilder, PermissionsBitField, InteractionContextType, ApplicationIntegrationType } = require("discord.js"),
	{ QueryType } = require("discord-player"),
	{ YoutubeiExtractor } = require("discord-player-youtubei");
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
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
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
		await interaction.deferReply();

		const query = interaction.options.getString("query"),
			voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { edit: true });

		const perms = voice.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT", null, { edit: true });

		const searchResult = await client.player.search(query, {
			requestedBy: interaction.member,
		});

		if (!searchResult.hasTracks()) return interaction.error("music/play:NO_RESULT", { query }, { edit: true, ephemeral: true });
		else {
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
					songName: searchResult.hasPlaylist() ? searchResult.playlist.title : `${searchResult.tracks[0].title} - ${searchResult.tracks[0].author}`,
					songURL: searchResult.hasPlaylist() ? searchResult.playlist.url : searchResult.tracks[0].url,
				}),
			});
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
		if (query === "" || query === null) return interaction.respond([ { name: "No Query Provided", value: "" } ]);
		if (query.startsWith("http")) return interaction.respond([ { name: "Current Link", value: query } ]);

		const youtubeResults = await client.player.search(query, { searchEngine: `ext:${YoutubeiExtractor.identifier}` });
		const spotifyResults = await client.player.search(query, { searchEngine: QueryType.SPOTIFY_SEARCH });
		const tracks = [];

		youtubeResults.tracks
			.slice(0, 5)
			.map(t => ({
				name: `YouTube: ${`${t.title} - ${t.author} (${t.duration})`.length > 75 ? `${`${t.title} - ${t.author}`.substring(0, 75)}... (${t.duration})` : `${t.title} - ${t.author} (${t.duration})`}`,
				value: t.url,
			}))
			.forEach(t => tracks.push({ name: t.name, value: t.value }));

		spotifyResults.tracks
			.slice(0, 5)
			.map(t => ({
				name: `Spotify: ${`${t.title} - ${t.author} (${t.duration})`.length > 75 ? `${`${t.title} - ${t.author}`.substring(0, 75)}... (${t.duration})` : `${t.title} - ${t.author} (${t.duration})`}`,
				value: t.url,
			}))
			.forEach(t => tracks.push({ name: t.name, value: t.value }));

		return interaction.respond(tracks);
	}
}

module.exports = Play;
