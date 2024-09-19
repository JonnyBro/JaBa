const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
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
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.PrivateChannel, InteractionContextType.Guild]),
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
				const locale = (await client.getGuildData(interaction.guildId)).language;

				const queue = client.player.nodes.get(interaction.guildId);
				if (!queue) return interaction.error("music/play:NOT_PLAYING", null, locale);

				const { embeds, size } = generateQueueEmbeds(interaction, queue, locale);

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
							content: `${interaction.translate("common:PAGE", null, locale)}: **${currentPage + 1}**/**${size}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (interaction.customId === "queue_next_page") {
					await interaction.deferUpdate();

					if (currentPage < size - 1) {
						currentPage++;

						interaction.editReply({
							content: `${interaction.translate("common:PAGE", null, locale)}: **${currentPage + 1}**/**${size}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (interaction.customId === "queue_jump_page") {
					await interaction.deferUpdate();

					const selectMenu = new StringSelectMenuBuilder()
						.setCustomId("queue_select")
						.setPlaceholder(interaction.translate("common:NOTHING_SELECTED", null, locale));

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
						content: `${interaction.translate("common:PAGE", null, locale)}: **${page + 1}**/**${size}**`,
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
		const queue = client.player.nodes.get(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		const { embeds, size } = generateQueueEmbeds(interaction, queue),
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
 * @param {import("discord-player").GuildQueue} queue
 * @param {string} locale
 * @returns
 */
function generateQueueEmbeds(interaction, queue, locale) {
	const embeds = [],
		currentTrack = queue.currentTrack,
		translated = {
			"3": interaction.translate("music/loop:AUTOPLAY", null, locale),
			"2": interaction.translate("music/loop:QUEUE", null, locale),
			"1": interaction.translate("music/loop:TRACK", null, locale),
			"0": interaction.translate("common:DISABLED", null, locale),
		};

	let k = 10;

	if (!queue.tracks.size) {
		const embed = interaction.client.embed({
			title: interaction.translate("music/nowplaying:CURRENTLY_PLAYING", null, locale),
			thumbnail: currentTrack.thumbnail || null,
			description: `${interaction.translate("music/nowplaying:REPEAT", null, locale)}: \`${translated[queue.repeatMode]}\`\n${
				currentTrack.url.startsWith("./clips") ? `${currentTrack.title} (clips)` : `[${currentTrack.title}](${currentTrack.url})`
			}\n> ${interaction.translate("music/queue:ADDED", null, locale)} ${currentTrack.requestedBy}\n\n**${interaction.translate("music/queue:NEXT", null, locale)}**\n${interaction.translate("music/queue:NO_QUEUE", null, locale)}`,
		});

		embeds.push(embed);

		return { embeds: embeds, size: embeds.length };
	}

	for (let i = 0; i < queue.getSize(); i += 10) {
		const current = queue.tracks.toArray().slice(i, k);
		let j = i;
		k += 10;

		const info = current.map(track => `${++j}. ${track.url.startsWith("./clips") ? `${track.title} (clips)` : `[${track.title}](${track.url})`}\n> ${interaction.translate("music/queue:ADDED", null, locale)} ${track.requestedBy}`).join("\n");

		const embed = interaction.client.embed({
			title: interaction.translate("music/nowplaying:CURRENTLY_PLAYING", null, locale),
			thumbnail: currentTrack.thumbnail || null,
			description: `${interaction.translate("music/nowplaying:REPEAT", null, locale)}: \`${translated[queue.repeatMode]}\`\n${
				currentTrack.url.startsWith("./clips") ? `${currentTrack.title} (clips)` : `[${currentTrack.title}](${currentTrack.url})`
			}\n * ${interaction.translate("music/queue:ADDED", null, locale)} ${currentTrack.requestedBy}\n\n**${interaction.translate("music/queue:NEXT", null, locale)}**\n${info}`,
		});

		embeds.push(embed);
	}

	return { embeds: embeds, size: embeds.length };
}

module.exports = Queue;
