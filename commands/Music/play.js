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
						.setRequired(true),
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
			voice = interaction.member.voice;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { edit: true });

		const perms = voice.channel.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT", null, { edit: true });

		const player = await client.lavalink.createPlayer({
			guildId: interaction.guildId,
			voiceChannelId: voice.channelId,
			textChannelId: interaction.channelId,
			selfDeaf: true,
			selfMute: false,
			volume: 100,
		});

		await player.connect();

		const res = await player.search({ query }, interaction.member);

		if (res.loadType === "playlist") await player.queue.add(res.tracks);
		else if (res.loadType === "search") await player.queue.add(res.tracks[0]);
		else if (res.loadType === "track") await player.queue.add(res.tracks[0]);
		else console.log(res);

		if (!player.playing) await player.play();

		interaction.editReply({
			content: interaction.translate("music/play:ADDED_QUEUE", {
				songName: res.loadType === "playlist" ? res.playlist.name : `${res.tracks[0].info.title} - ${res.tracks[0].info.author}`,
			}),
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").AutocompleteInteraction} interaction
	 * @returns
	 */
	// async autocompleteRun(client, interaction) { // TODO: Works from time to time
	// 	const query = interaction.options.getString("query");
	// 	if (query === "") return;

	// 	if (!client.lavalink.players.get(interaction.guildId)) {
	// 		const player = await client.lavalink.createPlayer({
	// 			guildId: interaction.guildId,
	// 			voiceChannelId: interaction.member.voice.channelId,
	// 			textChannelId: interaction.channelId,
	// 			selfDeaf: true,
	// 			selfMute: false,
	// 			volume: 100,
	// 		});

	// 		const results = await player.search({ query }, interaction.member);
	// 		if (results.loadType === "empty") return interaction.respond([{ name: "Nothing found", "value": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }]);
	// 		const tracks = [];

	// 		results.tracks
	// 			.map(t => ({
	// 				name: `YouTube: ${`${t.info.title} - ${t.info.author} (${client.functions.printDate(client, t.info.duration, null, interaction.data.guild.lanugage)})`.length > 75 ? `${`${t.info.title} - ${t.info.author}`.substring(0, 75)}... (${client.functions.printDate(client, t.info.duration, null, interaction.data.guild.lanugage)})` : `${t.info.title} - ${t.info.author} (${client.functions.printDate(client, t.info.duration, null, interaction.data.guild.lanugage)})`}`,
	// 				value: t.info.uri,
	// 			}))
	// 			.forEach(t => tracks.push({ name: t.name, value: t.value }));

	// 		return interaction.respond(tracks);
	// 	}
	// }
}

module.exports = Play;
