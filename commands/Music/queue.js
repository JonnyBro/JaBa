const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js"),
	{ QueueRepeatMode } = require("discord-player-play-dl");
const BaseCommand = require("../../base/BaseCommand");

class Queue extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("queue")
				.setDescription(client.translate("music/queue:DESCRIPTION"))
				.setDMPermission(false),
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
		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		let currentPage = 0;
		let embeds = generateQueueEmbeds(interaction, queue);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("queue_prev_page")
					.setLabel(interaction.translate("music/queue:PREV_PAGE"))
					.setStyle(ButtonStyle.Primary)
					.setEmoji("⬅️"),
				new ButtonBuilder()
					.setCustomId("queue_next_page")
					.setLabel(interaction.translate("music/queue:NEXT_PAGE"))
					.setStyle(ButtonStyle.Primary)
					.setEmoji("➡️"),
				new ButtonBuilder()
					.setCustomId("queue_jump_page")
					.setLabel(interaction.translate("music/queue:JUMP_PAGE"))
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("↗️"),
				new ButtonBuilder()
					.setCustomId("queue_stop")
					.setLabel(interaction.translate("common:CANCEL"))
					.setStyle(ButtonStyle.Danger)
					.setEmoji("⏹️"),
			);

		await interaction.reply({
			content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
			embeds: [embeds[currentPage]],
			components: [row]
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (20 * 1000) });

		collector.on("collect", async i => {
			if (i.isButton()) {
				if (i.customId === "queue_prev_page") {
					i.deferUpdate();
					if (embeds != generateQueueEmbeds(interaction, queue)) embeds = generateQueueEmbeds(interaction, queue);

					if (currentPage !== 0) {
						--currentPage;
						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
							embeds: [embeds[currentPage]],
							components: [row]
						});
					}
				} else if (i.customId === "queue_next_page") {
					i.deferUpdate();
					if (embeds != generateQueueEmbeds(interaction, queue)) embeds = generateQueueEmbeds(interaction, queue);

					if (currentPage < embeds.length - 1) {
						currentPage++;
						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
							embeds: [embeds[currentPage]],
							components: [row]
						});
					}
				} else if (i.customId === "queue_jump_page") {
					i.deferUpdate();
					if (embeds != generateQueueEmbeds(interaction, queue)) embeds = generateQueueEmbeds(interaction, queue);

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
				} else if (i.customId === "queue_stop") {
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
	}
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {import("discord-player-play-dl").Queue} queue
 * @returns
 */
function generateQueueEmbeds(interaction, queue) {
	const embeds = [];
	const currentTrack = queue.current;
	let k = 10;

	if (!queue.tracks.length) {
		const embed = new EmbedBuilder()
			.setTitle(interaction.translate("music/nowplaying:CURRENTLY_PLAYING"))
			.setThumbnail(currentTrack.thumbnail)
			.setColor(interaction.client.config.embed.color)
			.setDescription(`${interaction.translate("music/nowplaying:REPEAT")}: \`${
				queue.repeatMode === QueueRepeatMode.AUTOPLAY ? interaction.translate("music/nowplaying:AUTOPLAY") :
					queue.repeatMode === QueueRepeatMode.QUEUE ? interaction.translate("music/nowplaying:QUEUE") :
						queue.repeatMode === QueueRepeatMode.TRACK ? interaction.translate("music/nowplaying:TRACK") : interaction.translate("common:DISABLED")
			}\`\n${interaction.translate("music/queue:DURATION")}: \`${interaction.client.convertTime(Date.now() + queue.totalTime, false, true, interaction.guild.data.language)}\`\n[${currentTrack.title}](${currentTrack.url})\n> ${interaction.translate("music/queue:ADDED")} ${currentTrack.requestedBy}\n\n**${interaction.translate("music/queue:NEXT")}**\n${interaction.translate("music/queue:NO_QUEUE")}`)
			.setTimestamp();
		embeds.push(embed);

		return embeds;
	}

	for (let i = 0; i < queue.tracks.length; i += 10) {
		const current = queue.tracks.slice(i, k);
		let j = i;
		k += 10;

		const info = current.map(track => `${++j}. [${track.title}](${track.url})\n> ${interaction.translate("music/queue:ADDED")} ${track.requestedBy}`).join("\n");

		const embed = new EmbedBuilder()
			.setTitle(interaction.translate("music/nowplaying:CURRENTLY_PLAYING"))
			.setThumbnail(currentTrack.thumbnail)
			.setColor(interaction.client.config.embed.color)
			.setDescription(`${interaction.translate("music/nowplaying:REPEAT")}: \`${
				queue.repeatMode === QueueRepeatMode.AUTOPLAY ? interaction.translate("music/nowplaying:AUTOPLAY") :
					queue.repeatMode === QueueRepeatMode.QUEUE ? interaction.translate("music/nowplaying:QUEUE") :
						queue.repeatMode === QueueRepeatMode.TRACK ? interaction.translate("music/nowplaying:TRACK") : interaction.translate("common:DISABLED")
			}\`\n${interaction.translate("music/queue:DURATION")}: \`${interaction.client.convertTime(Date.now() + queue.totalTime, false, true, interaction.guild.data.language)}\`\n[${currentTrack.title}](${currentTrack.url})\n> ${interaction.translate("music/queue:ADDED")} ${currentTrack.requestedBy}\n\n**${interaction.translate("music/queue:NEXT")}**\n${info}`)
			.setTimestamp();
		embeds.push(embed);
	}

	return embeds;
}

module.exports = Queue;