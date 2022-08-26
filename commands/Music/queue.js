const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
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
				.setDescription(client.translate("music/queue:DESCRIPTION")),
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
		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		let currentPage = 0;
		const embeds = generateQueueEmbed(interaction, queue);

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
			content: interaction.translate("music/queue:PAGE", {
				current: currentPage + 1,
				length: embeds.length
			}),
			embeds: [embeds[currentPage]],
			components: [row]
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (60 * 1000) });

		collector.on("collect", async i => {
			if (i.isButton()) {
				if (i.customId === "queue_prev_page") {
					i.deferUpdate();

					if (currentPage !== 0) {
						--currentPage;
						interaction.editReply({
							content: interaction.translate("music/queue:PAGE", {
								current: currentPage + 1,
								length: embeds.length
							}),
							embeds: [embeds[currentPage]],
							components: [row]
						});
					}
				} else if (i.customId === "queue_next_page") {
					i.deferUpdate();

					if (currentPage < embeds.length - 1) {
						currentPage++;
						interaction.editReply({
							content: interaction.translate("music/queue:PAGE", {
								current: currentPage + 1,
								length: embeds.length
							}),
							embeds: [embeds[currentPage]],
							components: [row]
						});
					}
				} else if (i.customId === "queue_jump_page") {
					i.deferUpdate();

					const msg = await interaction.followUp({
						content: interaction.translate("music/queue:PAGE_TO_JUMP", {
							length: embeds.length
						}),
						fetchReply: true
					});

					const filter = res => {
						return res.author.id === interaction.user.id && !isNaN(res.content);
					};

					interaction.channel.awaitMessages({ filter, max: 1, time: (30 * 1000) }).then(collected => {
						if (embeds[Number(collected.first().content) - 1]) {
							currentPage = Number(collected.first().content) - 1;
							interaction.editReply({
								content: interaction.translate("music/queue:PAGE", {
									current: currentPage + 1,
									length: embeds.length
								}),
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
					collector.stop(true);
				}
			}
		});

		collector.on("end", async (_, reason) => {
			if (reason) {
				const row = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId("queue_prev_page")
							.setLabel(interaction.translate("music/queue:PREV_PAGE"))
							.setStyle(ButtonStyle.Primary)
							.setEmoji("⬅️")
							.setDisabled(true),
						new ButtonBuilder()
							.setCustomId("queue_next_page")
							.setLabel(interaction.translate("music/queue:NEXT_PAGE"))
							.setStyle(ButtonStyle.Primary)
							.setEmoji("➡️")
							.setDisabled(true),
						new ButtonBuilder()
							.setCustomId("queue_jump_page")
							.setLabel(interaction.translate("music/queue:JUMP_PAGE"))
							.setStyle(ButtonStyle.Secondary)
							.setEmoji("↗️")
							.setDisabled(true),
						new ButtonBuilder()
							.setCustomId("queue_stop")
							.setLabel(interaction.translate("common:CANCEL"))
							.setStyle(ButtonStyle.Danger)
							.setEmoji("⏹️")
							.setDisabled(true),
					);
				return interaction.editReply({
					components: [row]
				});
			}
		});
	}
}

function generateQueueEmbed(interaction, queue) {
	const embeds = [];
	const currentTrack = queue.current;
	let k = 10;

	for (let i = 0; i < queue.tracks.length; i += 10) {
		const current = queue.tracks.slice(i, k);
		let j = i;
		k += 10;

		const info = current.map(track => `${++j}. [${track.title}](${track.url})\n> ${interaction.translate("music/queue:ADDED")} ${track.requestedBy}`).join("\n");

		const embed = new EmbedBuilder()
			.setTitle(interaction.translate("music/nowplaying:CURRENTLY_PLAYING"))
			.setThumbnail(currentTrack.thumbnail)
			.setColor(interaction.client.config.embed.color)
			.setDescription(`[${currentTrack.title}](${currentTrack.url})\n> ${interaction.translate("music/queue:ADDED")} ${currentTrack.requestedBy}\n\n**${interaction.translate("music/queue:NEXT")}**\n${info}`)
			.setTimestamp();
		embeds.push(embed);
	}

	return embeds;
}

module.exports = Queue;