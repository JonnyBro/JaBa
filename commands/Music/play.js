const { SlashCommandBuilder, PermissionsBitField } = require("discord.js"),
	{ QueryType } = require("discord-player");
const BaseCommand = require("../../base/BaseCommand");

class Play extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("play")
				.setDescription(client.translate("music/play:DESCRIPTION"))
				.addStringOption(option => option.setName("query")
					.setDescription(client.translate("music/play:QUERY"))
					.setRequired(true)),
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
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();
		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		const query = interaction.options.getString("query");
		const perms = voice.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT");

		const searchResult = await client.player.search(query, {
			requestedBy: interaction.user,
			searchEngine: query.includes("soundcloud") ? QueryType.SOUNDCLOUD_SEARCH : QueryType.AUTO
		}).catch(() => {});
		if (!searchResult || !searchResult.tracks.length) return interaction.editReply({
			content: interaction.translate("music/play:NO_RESULT", {
				query
			})
		});

		const queue = client.player.getQueue(interaction.guildId) || client.player.createQueue(interaction.guild, {
			metadata: {
				channel: interaction.channel
			},
			ytdlOptions: {
				filter: "audioonly",
				highWaterMark: 1 << 30,
				dlChunkSize: 0,
				liveBuffer: 4900
			}
		});

		if (!queue.tracks[0]) {
			searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
		} else {
			searchResult.playlist ? searchResult.tracks.forEach(track => queue.insert(track)) : queue.insert(searchResult.tracks[0]);
		}

		try {
			if (!queue.connection) await queue.connect(interaction.member.voice.channel);
			if (!queue.playing) await queue.play();

			interaction.editReply({
				content: interaction.translate("music/play:ADDED_QUEUE", {
					songName: searchResult.playlist ? searchResult.playlist.title : searchResult.tracks[0].title
				})
			});
		} catch (e) {
			client.player.deleteQueue(interaction.guildId);
			interaction.error("music/play:ERR_OCCURRED", {
				error: e
			});
			console.error(e);
		}
	}
}

module.exports = Play;