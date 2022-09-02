const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js"),
	{ Track, Util } = require("discord-player");
const BaseCommand = require("../../base/BaseCommand"),
	playdl = require("play-dl");

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
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.editReply({ content: interaction.translate("music/play:NO_VOICE_CHANNEL") });
		const query = interaction.options.getString("query");
		const perms = voice.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.editReply({ content: interaction.translate("music/play:VOICE_CHANNEL_CONNECT") });

		try {
			var searchResult;
			if (!query.includes("http")) {
				const search = await playdl.search(query, { limit: 10 });

				if (search) {
					const found = search.map(track => new Track(client.player, {
						title: track.title,
						duration:  Util.buildTimeCode(Util.parseMS(track.durationInSec * 1000)),
						thumbnail: track.thumbnails[0].url || "https://cdn.discordapp.com/attachments/708642702602010684/1012418217660121089/noimage.png",
						views: track.views,
						author: track.channel.name,
						description: "search",
						url: track.url,
						requestedBy: interaction.user,
						playlist: null,
						source: "youtube"
					}));

					searchResult = { playlist: null, tracks: found, searched: true };
				}
			} else {
				searchResult = await client.player.search(query, {
					requestedBy: interaction.user
				});
			}
		} catch (error) {
			return interaction.editReply({
				content: interaction.translate("music/play:NO_RESULT", {
					query,
					error
				})
			});
		}

		const queue = client.player.getQueue(interaction.guildId) || client.player.createQueue(interaction.guild, {
			metadata: { channel: interaction.channel },
			leaveOnEnd: true,
			leaveOnStop: true,
			bufferingTimeout: 1000,
			disableVolume: false,
			spotifyBridge: false,
			/**
			 *
			 * @param {import("discord-player").Track} track
			 * @param {import("discord-player").TrackSource} source
			 * @param {import("discord-player").Queue} queue
			 * @returns
			 */
			async onBeforeCreateStream(track, source) {
				console.log(track, source);
				if (source === "youtube" || source === "soundcloud")
					return (await playdl.stream(track.url, { discordPlayerCompatibility: true })).stream;
			}
		});

		if (searchResult.searched) {
			const row1 = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId("1")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("1️⃣"),
					new ButtonBuilder()
						.setCustomId("2")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("2️⃣"),
					new ButtonBuilder()
						.setCustomId("3")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("3️⃣"),
					new ButtonBuilder()
						.setCustomId("4")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("4️⃣"),
					new ButtonBuilder()
						.setCustomId("5")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("5️⃣"),
				);
			const row2 = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId("6")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("6️⃣"),
					new ButtonBuilder()
						.setCustomId("7")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("7️⃣"),
					new ButtonBuilder()
						.setCustomId("8")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("8️⃣"),
					new ButtonBuilder()
						.setCustomId("9")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("9️⃣"),
					new ButtonBuilder()
						.setCustomId("10")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("🔟"),
				);
			const row3 = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId("search_cancel")
						.setStyle(ButtonStyle.Primary)
						.setEmoji("❌"),
				);
			const rows = [row1, row2, row3];

			const embed = new EmbedBuilder()
				.setTitle(interaction.translate("music/play:RESULTS_TITLE", {
					query
				}))
				.setColor(client.config.embed.color)
				.setDescription(searchResult.tracks.map(track => {
					const views = new Intl.NumberFormat(interaction.client.languages.find(language => language.name === interaction.guild.data.language).moment, {
						notation: "compact", compactDisplay: "short"
					}).format(track.views);

					return `${searchResult.tracks.indexOf(track) + 1}. [${track.title}](${track.url})\n> ${interaction.translate("common:VIEWS")}: **${views}**\n`;
				}).join("\n"))
				.setTimestamp();

			await interaction.editReply({
				content: interaction.translate("music/play:SEARCH_RESULTS"),
				embeds: [embed],
				components: [row1, row2, row3]
			});

			const filter = i => i.user.id === interaction.user.id;
			const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (15 * 1000) });

			collector.on("collect", async i => {
				if (i.isButton()) {
					if (i.customId >= 1 && i.customId <= 10) {
						i.deferUpdate();

						var selected = searchResult.tracks[i.customId - 1];
						queue.addTrack(selected);

						try {
							if (!queue.connection) await queue.connect(interaction.member.voice.channel);
							if (!queue.playing) await queue.play();

							interaction.editReply({
								content: interaction.translate("music/play:ADDED_QUEUE", {
									songName: selected.title
								}),
								components: [],
								embeds: []
							});

							collector.stop();
							return;
						} catch (error) {
							client.player.deleteQueue(interaction.guildId);
							console.log(error);
							return interaction.editReply({
								content: interaction.translate("music/play:ERR_OCCURRED", {
									error
								})
							});
						}
					} else if (i.customId === "search_cancel") {
						i.deferUpdate();

						rows.forEach(row => {
							row.components.forEach(component => {
								component.setDisabled(true);
							});
						});

						return interaction.editReply({
							components: [row1, row2, row3]
						});
					}
				}
			});

			collector.on("end", async (_, reason) => {
				if (reason === "idle") {
					rows.forEach(row => {
						row.components.forEach(component => {
							component.setDisabled(true);
						});
					});

					return interaction.editReply({
						components: [row1, row2, row3]
					});
				}
			});

			return;
		}

		searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);

		try {
			if (!queue.connection) await queue.connect(interaction.member.voice.channel);
			if (!queue.playing) await queue.play();

			interaction.editReply({
				content: interaction.translate("music/play:ADDED_QUEUE", {
					songName: searchResult.playlist ? searchResult.playlist.title : searchResult.tracks[0].title
				})
			});
		} catch (error) {
			client.player.deleteQueue(interaction.guildId);
			console.log(error);
			return interaction.editReply({
				content: interaction.translate("music/play:ERR_OCCURRED", {
					error
				})
			});
		}
	}
}

module.exports = Play;