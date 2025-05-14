import {
	convertTime,
	editReplyError,
	getLocalizedDesc,
	translateContext,
} from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
	InteractionContextType,
	MessageFlags,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { RainlinkPlayer } from "rainlink";

const client = useClient();

export const data: CommandData = {
	name: "queue",
	...getLocalizedDesc("music/queue:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const player = client.rainlink.players.get(interaction.guildId!);
	if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");

	const { embeds, size } = await generateQueueEmbeds(interaction, player);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId("queue_prev_page")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("⬅️")
			.setDisabled(true),
		new ButtonBuilder()
			.setCustomId("queue_next_page")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("➡️")
			.setDisabled(size <= 1),
		new ButtonBuilder()
			.setCustomId("queue_jump_page")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("↗️"),
		new ButtonBuilder()
			.setCustomId("queue_stop")
			.setStyle(ButtonStyle.Danger)
			.setEmoji("❌"),
	);

	await interaction.editReply({
		content: `${await translateContext(interaction, "common:PAGE")}: **1**/**${size}**`,
		embeds: [embeds[0]],
		components: [row],
	});
};

client.on("interactionCreate", async interaction => {
	if (!interaction.isButton()) return;

	if (interaction.customId.startsWith("queue_")) {
		const player = client.rainlink.players.get(interaction.guildId!);
		if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");

		const pageText = interaction.message.content.match(/\*\*(\d+)\*\*\/\*\*(\d+)\*\*/);
		let currentPage = pageText ? parseInt(pageText[1], 10) - 1 : 0;

		const { embeds, size } = await generateQueueEmbeds(interaction, player);

		switch (interaction.customId) {
			case "queue_prev_page": {
				await interaction.deferUpdate();

				if (currentPage !== 0) {
					--currentPage;

					const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("queue_prev_page")
							.setStyle(ButtonStyle.Primary)
							.setEmoji("⬅️")
							.setDisabled(currentPage === 0),
						new ButtonBuilder()
							.setCustomId("queue_next_page")
							.setStyle(ButtonStyle.Primary)
							.setEmoji("➡️")
							.setDisabled(currentPage >= size - 1),
						new ButtonBuilder()
							.setCustomId("queue_jump_page")
							.setStyle(ButtonStyle.Secondary)
							.setEmoji("↗️"),
						new ButtonBuilder()
							.setCustomId("queue_stop")
							.setStyle(ButtonStyle.Danger)
							.setEmoji("❌"),
					);

					interaction.editReply({
						content: `${await translateContext(
							interaction,
							"common:PAGE",
						)}: **${currentPage + 1}**/**${size}**`,
						embeds: [embeds[currentPage]],
						components: [row],
					});
				}

				break;
			}

			case "queue_next_page": {
				await interaction.deferUpdate();

				if (currentPage < size - 1) {
					currentPage++;

					const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("queue_prev_page")
							.setStyle(ButtonStyle.Primary)
							.setEmoji("⬅️")
							.setDisabled(currentPage === 0),
						new ButtonBuilder()
							.setCustomId("queue_next_page")
							.setStyle(ButtonStyle.Primary)
							.setEmoji("➡️")
							.setDisabled(currentPage >= size - 1),
						new ButtonBuilder()
							.setCustomId("queue_jump_page")
							.setStyle(ButtonStyle.Secondary)
							.setEmoji("↗️"),
						new ButtonBuilder()
							.setCustomId("queue_stop")
							.setStyle(ButtonStyle.Danger)
							.setEmoji("❌"),
					);

					interaction.editReply({
						content: `${await translateContext(
							interaction,
							"common:PAGE",
						)}: **${currentPage + 1}**/**${size}**`,
						embeds: [embeds[currentPage]],
						components: [row],
					});
				}

				break;
			}

			case "queue_jump_page": {
				const m = await interaction.deferUpdate();

				const selectMenu = new StringSelectMenuBuilder()
					.setCustomId("queue_select")
					.setPlaceholder(await translateContext(interaction, "common:NOTHING_SELECTED"));

				for (let i = 0; i < size; i++) {
					selectMenu.addOptions(
						new StringSelectMenuOptionBuilder()
							.setLabel((i + 1).toString())
							.setValue(i.toString()),
					);
				}

				const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					selectMenu,
				);

				let page = 0;

				await interaction.followUp({
					components: [selectRow],
					flags: MessageFlags.Ephemeral,
				});

				client.once("interactionCreate", async interaction => {
					if (!interaction.isStringSelectMenu()) return;
					if (interaction.customId !== "queue_select") return;

					await interaction.deferUpdate();

					page = Number(interaction.values[0]);

					const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("queue_prev_page")
							.setStyle(ButtonStyle.Primary)
							.setEmoji("⬅️")
							.setDisabled(page === 0),
						new ButtonBuilder()
							.setCustomId("queue_next_page")
							.setStyle(ButtonStyle.Primary)
							.setEmoji("➡️")
							.setDisabled(page >= size - 1),
						new ButtonBuilder()
							.setCustomId("queue_jump_page")
							.setStyle(ButtonStyle.Secondary)
							.setEmoji("↗️"),
						new ButtonBuilder()
							.setCustomId("queue_stop")
							.setStyle(ButtonStyle.Danger)
							.setEmoji("❌"),
					);

					await m.edit({
						content: `${await translateContext(
							interaction,
							"common:PAGE",
						)}: **${page + 1}**/**${size}**`,
						embeds: [embeds[page]],
						components: [row],
					});
				});

				break;
			}

			case "queue_stop": {
				await interaction.deferUpdate();

				interaction.editReply({
					components: [],
				});

				break;
			}
		}
	}
});

async function generateQueueEmbeds(interaction: Interaction, player: RainlinkPlayer) {
	const embeds = [];
	const currentTrack = player.queue.current!;
	const queue = player.queue;
	const translated = {
		none: await translateContext(interaction, "common:DISABLED"),
		song: await translateContext(interaction, "music/loop:TRACK"),
		queue: await translateContext(interaction, "music/loop:QUEUE"),
	};

	if (!queue.length) {
		const embed = createEmbed({
			title: await translateContext(interaction, "music/nowplaying:CURRENTLY_PLAYING"),
		})
			.setThumbnail(currentTrack.artworkUrl || null)
			.setDescription(
				`${await translateContext(interaction, "music/nowplaying:REPEAT")}: \`${
					translated[player.loop]
				}\`\n[${currentTrack.title}](${currentTrack.uri}) - ${convertTime(
					currentTrack.duration,
				)}\n> ${await translateContext(
					interaction,
					"music/queue:ADDED",
				)} ${currentTrack.requester}\n\n**${await translateContext(
					interaction,
					"music/queue:NEXT",
				)}**\n${await translateContext(interaction, "music/queue:NO_QUEUE")}`,
			);

		embeds.push(embed);

		return { embeds, size: embeds.length };
	}

	const totalDuration = queue.reduce((acc, track) => acc + track.duration, currentTrack.duration);
	const formattedTotalDuration = convertTime(totalDuration);

	let k = 10;
	for (let i = 0; i < queue.length; i += 10) {
		const current = queue.slice(i, k);
		let j = i;
		k += 10;

		const addedText = await translateContext(interaction, "music/queue:ADDED");
		const playsIn = async (index: number) =>
			await translateContext(interaction, "music/queue:PLAYS_IN", {
				time: getTimeUntilTrack(player, index),
			});

		const info = (
			await Promise.all(
				current.map(async (track, index) => {
					const queueIndex = i + index;
					return `${++j}. [${track.title}](${track.uri}) - ${convertTime(
						track.duration,
					)}\n> ${addedText} ${track.requester}\n> ${await playsIn(queueIndex)}`;
				}),
			)
		).join("\n");

		const embed = createEmbed({
			title: await translateContext(interaction, "music/nowplaying:CURRENTLY_PLAYING"),
		})
			.setThumbnail(currentTrack.artworkUrl || null)
			.setDescription(
				`${await translateContext(interaction, "music/queue:DURATION", {
					time: formattedTotalDuration,
				})}\n${await translateContext(interaction, "music/nowplaying:REPEAT")}: \`${
					translated[player.loop]
				}\`\n[${currentTrack.title}](${currentTrack.uri}) - ${convertTime(
					currentTrack.duration,
				)}\n * ${await translateContext(interaction, "music/queue:ADDED")} ${
					currentTrack.requester
				}\n\n**${await translateContext(interaction, "music/queue:NEXT")}**\n${info}`,
			);

		embeds.push(embed);
	}

	return { embeds, size: embeds.length };
}

function getTimeUntilTrack(player: RainlinkPlayer, queueIndex: number) {
	const currentPosition = player.position || 0;
	const currentTrackDuration = player.queue.current?.duration || 0;
	const remainingCurrentTrack = Math.max(0, currentTrackDuration - currentPosition);

	let sumQueueDurations = 0;
	for (let i = 0; i < queueIndex; i++) {
		sumQueueDurations += player.queue[i]?.duration || 0;
	}

	const totalTime = remainingCurrentTrack + sumQueueDurations;

	return convertTime(totalTime);
}
