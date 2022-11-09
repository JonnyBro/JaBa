const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require("discord.js"),
	{ joinVoiceChannel, createAudioResource, createAudioPlayer, getVoiceConnection, AudioPlayerStatus } = require("@discordjs/voice");
const BaseCommand = require("../../base/BaseCommand"),
	fs = require("fs");

class Clips extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("clips")
				.setDescription(client.translate("music/clips:DESCRIPTION"))
				.setDMPermission(false)
				.addStringOption(option => option.setName("query")
					.setDescription(client.translate("music/clips:QUERY"))
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
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
		fs.readdir("./clips", async function (err, files) {
			await interaction.deferReply();

			const query = interaction.options.getString("query");

			if (err) {
				interaction.editReply({
					content: "```js\n" + err + "```"
				});
				return console.log("Unable to read directory: " + err);
			}

			if (query === "list") {
				const clips = files.map(file => file.substring(0, file.length - 4));
				let currentPage = 0;
				const embeds = generateClipsEmbeds(interaction, clips);

				const row = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId("clips_prev_page")
							.setStyle(ButtonStyle.Primary)
							.setEmoji("⬅️"),
						new ButtonBuilder()
							.setCustomId("clips_next_page")
							.setStyle(ButtonStyle.Primary)
							.setEmoji("➡️"),
						new ButtonBuilder()
							.setCustomId("clips_jump_page")
							.setStyle(ButtonStyle.Secondary)
							.setEmoji("↗️"),
						new ButtonBuilder()
							.setCustomId("clips_stop")
							.setStyle(ButtonStyle.Danger)
							.setEmoji("⏹️"),
					);

				await interaction.editReply({
					content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
					embeds: [embeds[currentPage]],
					components: [row]
				});

				const filter = i => i.user.id === interaction.user.id;
				const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (20 * 1000) });

				collector.on("collect", async i => {
					if (i.isButton()) {
						if (i.customId === "clips_prev_page") {
							i.deferUpdate();

							if (currentPage !== 0) {
								--currentPage;
								interaction.editReply({
									content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
									embeds: [embeds[currentPage]],
									components: [row]
								});
							}
						} else if (i.customId === "clips_next_page") {
							i.deferUpdate();

							if (currentPage < embeds.length - 1) {
								currentPage++;
								interaction.editReply({
									content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
									embeds: [embeds[currentPage]],
									components: [row]
								});
							}
						} else if (i.customId === "clips_jump_page") {
							i.deferUpdate();

							const msg = await interaction.followUp({
								content: interaction.translate("misc:JUMP_TO_PAGE", {
									length: embeds.length
								}),
								fetchReply: true
							});

							const filter = res => {
								return res.author.id === interaction.user.id && !isNaN(res.content);
							};

							interaction.channel.awaitMessages({ filter, max: 1, time: (10 * 1000) }).then(collected => {
								if (embeds[collected.first().content - 1]) {
									currentPage = collected.first().content - 1;
									interaction.editReply({
										content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
										embeds: [embeds[currentPage]],
										components: [row]
									});

									if (collected.first().deletable) collected.first().delete();
									if (msg.deletable) msg.delete();
								} else {
									if (collected.first().deletable) collected.first().delete();
									if (msg.deletable) msg.delete();
									return;
								}
							});
						} else if (i.customId === "clips_stop") {
							i.deferUpdate();
							collector.stop();
						}
					}
				});

				collector.on("end", () => {
					row.components.forEach(component => {
						component.setDisabled(true);
					});

					return interaction.editReply({
						components: [row]
					});
				});
			} else {
				const voice = interaction.member.voice.channel;
				if (!voice) return interaction.editReply({ content: interaction.translate("music/play:NO_VOICE_CHANNEL") });
				const queue = client.player.getQueue(interaction.guild.id);
				if (queue) return interaction.editReply({ content: interaction.translate("music/clips:ACTIVE_QUEUE") });
				if (getVoiceConnection(interaction.guild.id)) return interaction.editReply({ content: interaction.translate("music/clips:ACTIVE_CLIP") });
				if (!fs.existsSync(`./clips/${query}.mp3`)) return interaction.editReply({ content: interaction.translate("music/clips:NO_FILE", { file: query }) });

				try {
					const connection = joinVoiceChannel({
						channelId: voice.id,
						guildId: interaction.guild.id,
						adapterCreator: interaction.guild.voiceAdapterCreator
					});

					const resource = createAudioResource(fs.createReadStream(`./clips/${query}.mp3`));
					const player = createAudioPlayer()
						.on("error", err => {
							connection.destroy();
							console.error(err.message);
						});

					player.play(resource);
					connection.subscribe(player);

					player.on(AudioPlayerStatus.Idle, () => {
						connection.destroy();
					});
				} catch (error) {
					console.error(error);
				}

				await interaction.editReply({
					content: interaction.translate("music/clips:PLAYING", {
						clip: query
					}),
					components: []
				});
			}
		});
	}
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {Array} clips
 * @returns
 */
function generateClipsEmbeds(interaction, clips) {
	const embeds = [];
	let k = 10;

	for (let i = 0; i < clips.length; i += 10) {
		const current = clips.slice(i, k);
		k += 10;

		const page = current.join("\n");

		const embed = new EmbedBuilder()
			.setColor(interaction.client.config.embed.color)
			.setFooter({
				text: interaction.client.config.embed.footer
			})
			.setTitle(interaction.translate("music/clips:CLIPS_LIST"))
			.setDescription(page)
			.setTimestamp();
		embeds.push(embed);
	}

	return embeds;
}

module.exports = Clips;