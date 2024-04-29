const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Queue extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("queue")
				.setDescription(client.translate("music/queue:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("music/queue:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/queue:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad(client) {
		client.on("interactionCreate", async interaction => {
			if (!interaction.isButton()) return;

			if (interaction.customId.startsWith("queue_")) {
				interaction.data = [];
				interaction.data.guild = await client.findOrCreateGuild(interaction.guildId);

				const player = client.lavalink.getPlayer(interaction.guildId);
				if (!player) return interaction.error("music/play:NOT_PLAYING");

				const { embeds, size } = generateQueueEmbeds(interaction, player);

				let currentPage = Number(interaction.message.content.match(/\d+/g)[0]) - 1 ?? 0;

				const row = new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId("queue_prev_page").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
					new ButtonBuilder().setCustomId("queue_next_page").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
					new ButtonBuilder().setCustomId("queue_jump_page").setStyle(ButtonStyle.Secondary).setEmoji("↗️"),
					new ButtonBuilder().setCustomId("queue_stop").setStyle(ButtonStyle.Danger).setEmoji("❌"),
				);

				if (interaction.customId === "queue_prev_page") {
					await interaction.deferUpdate();

					if (currentPage !== 0) {
						--currentPage;

						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${size}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (interaction.customId === "queue_next_page") {
					await interaction.deferUpdate();

					if (currentPage < size - 1) {
						currentPage++;

						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${size}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (interaction.customId === "queue_jump_page") {
					await interaction.deferUpdate();

					const selectMenu = new StringSelectMenuBuilder()
						.setCustomId("queue_select")
						.setPlaceholder(interaction.translate("common:NOTHING_SELECTED"));

					for (let i = 0; i < size; i++) {
						selectMenu.addOptions(
							new StringSelectMenuOptionBuilder()
								.setLabel(`${i + 1}`)
								.setValue(`${i}`),
						);
					}

					const selectRow = new ActionRowBuilder().addComponents(selectMenu),
						msg = await interaction.followUp({
							components: [selectRow],
							ephemeral: true,
						});

					const filter = i => i.user.id === interaction.user.id,
						collected = await msg.awaitMessageComponent({ filter, time: 10 * 1000 }),
						page = Number(collected.values[0]);

					await collected.deferUpdate();

					return interaction.editReply({
						content: `${interaction.translate("common:PAGE")}: **${page + 1}**/**${size}**`,
						embeds: [embeds[page]],
						components: [row],
					});
				} else if (interaction.customId === "queue_stop") {
					await interaction.deferUpdate();

					row.components.forEach(component => {
						component.setDisabled(true);
					});

					return interaction.editReply({
						components: [row],
					});
				}
			}
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		const player = client.lavalink.getPlayer(interaction.guildId);
		if (!player) return interaction.error("music/play:NOT_PLAYING");

		const { embeds, size } = generateQueueEmbeds(interaction, player),
			row = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("queue_prev_page").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
				new ButtonBuilder().setCustomId("queue_next_page").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
				new ButtonBuilder().setCustomId("queue_jump_page").setStyle(ButtonStyle.Secondary).setEmoji("↗️"),
				new ButtonBuilder().setCustomId("queue_stop").setStyle(ButtonStyle.Danger).setEmoji("❌"),
			);

		if (interaction.customId) return await interaction.followUp({
			content: `${interaction.translate("common:PAGE")}: **1**/**${size}**`,
			embeds: [embeds[0]],
			components: [row],
		});

		await interaction.reply({
			content: `${interaction.translate("common:PAGE")}: **1**/**${size}**`,
			embeds: [embeds[0]],
			components: [row],
		});
	}
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {import("lavalink-client").Player} player
 * @returns
 */
function generateQueueEmbeds(interaction, player) {
	const embeds = [],
		currentTrack = player.queue.current,
		translated = {
			// "3": interaction.translate("music/loop:AUTOPLAY"),
			"queue": interaction.translate("music/loop:QUEUE"),
			"track": interaction.translate("music/loop:TRACK"),
			"off": interaction.translate("common:DISABLED"),
		};

	let k = 10;

	if (!player.queue.tracks.length) {
		const embed = interaction.client.embed({
			title: interaction.translate("music/nowplaying:CURRENTLY_PLAYING"),
			thumbnail: currentTrack.info.artworkUrl || null,
			description: `${interaction.translate("music/nowplaying:REPEAT")}: \`${translated[player.repeatMode]}\`\n${
				currentTrack.info.uri.startsWith("./clips") ? `${currentTrack.info.title} (clips)` : `[${currentTrack.info.title}](${currentTrack.info.uri})`
			}\n> ${interaction.translate("music/queue:ADDED")} ${currentTrack.requester.toString()}\n\n**${interaction.translate("music/queue:NEXT")}**\n${interaction.translate("music/queue:NO_QUEUE")}`,
		});

		embeds.push(embed);

		return { embeds: embeds, size: embeds.length };
	}

	for (let i = 0; i < player.queue.tracks.length; i += 10) {
		const current = player.queue.tracks.slice(i, k);
		let j = i;
		k += 10;

		const info = current.map(track => `${++j}. ${track.info.uri.startsWith("./clips") ? `${track.info.title} (clips)` : `[${track.info.title}](${track.info.uri})`}\n> ${interaction.translate("music/queue:ADDED")} ${track.requester.toString()}`).join("\n");

		const embed = interaction.client.embed({
			title: interaction.translate("music/nowplaying:CURRENTLY_PLAYING"),
			thumbnail: currentTrack.info.artworkUrl || null,
			description: `${interaction.translate("music/nowplaying:REPEAT")}: \`${translated[player.repeatMode]}\`\n${
				currentTrack.info.uri.startsWith("./clips") ? `${currentTrack.info.title} (clips)` : `[${currentTrack.info.title}](${currentTrack.info.uri})`
			}\n * ${interaction.translate("music/queue:ADDED")} ${currentTrack.requester.toString()}\n\n**${interaction.translate("music/queue:NEXT")}**\n${info}`,
		});

		embeds.push(embed);
	}

	return { embeds: embeds, size: embeds.length };
}

module.exports = Queue;
