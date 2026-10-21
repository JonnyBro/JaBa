import { convertTime, editReplyError, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { formatDuration, formatTrack, isAutoplayEnabled } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
	InteractionContextType,
} from "discord.js";
import { Player, Track } from "lavalink-client";

const client = useClient();
const QUEUE_PAGE_ID = "MUSIC_QUEUE";
const PAGE_SIZE = 10;

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

	const player = client.lavalink.getPlayer(interaction.guildId!);
	if (!player?.queue.current) return editReplyError(interaction, "music/play:NOT_PLAYING");

	await interaction.editReply(await buildQueuePage(interaction, player, 0));
};

componentRouter.register(QUEUE_PAGE_ID, async interaction => {
	if (!interaction.isButton()) return;

	const player = client.lavalink.getPlayer(interaction.guildId!);
	if (!player?.queue.current) {
		await interaction.update({
			content: await translateContext(interaction, "music/play:NOT_PLAYING"),
			embeds: [],
			components: [],
		});

		return;
	}

	const page = Number(interaction.customId.split(":")[1]) || 0;

	await interaction.update(await buildQueuePage(interaction, player, page));
});

async function buildQueuePage(interaction: Interaction, player: Player, page: number) {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);

	const current = player.queue.current!;
	const tracks = player.queue.tracks as Track[];
	const pages = Math.max(1, Math.ceil(tracks.length / PAGE_SIZE));
	page = Math.min(Math.max(page, 0), pages - 1);

	const lines = tracks
		.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
		.map((track, i) => `${page * PAGE_SIZE + i + 1}. ${formatTrack(track)} \`${formatDuration(track)}\``);

	const remaining = Math.max(0, current.info.duration - player.position);
	const totalDuration = tracks.reduce((acc, track) => acc + (track.info.duration || 0), remaining);

	const embed = createEmbed({
		title: await t("music/queue:QUEUE"),
		description: [
			`**${await t("music/queue:CURRENTLY_PLAYING")}:** ${formatTrack(current)}`,
			`\`${convertTime(player.position)} / ${formatDuration(current)}\``,
			"",
			`**${await t("music/queue:NEXT")}:**`,
			lines.join("\n") || (await t("music/queue:NO_QUEUE")),
		].join("\n"),
		fields: [
			{
				name: await t("music/queue:SETTINGS"),
				value: await t("music/queue:SETTINGS_VALUE", {
					volume: player.volume,
					loop: await t(`music/loop:MODE_${player.repeatMode.toUpperCase()}`),
					autoplay: await t(isAutoplayEnabled(player) ? "common:ENABLED" : "common:DISABLED"),
				}),
			},
		],
		footer: {
			text: `${await t("common:PAGE")} ${page + 1}/${pages} • ${await t("music/queue:TOTAL", {
				count: tracks.length,
				time: convertTime(totalDuration),
			})}`,
		},
	});

	if (current.info.artworkUrl) embed.setThumbnail(current.info.artworkUrl);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`${QUEUE_PAGE_ID}:${page - 1}`)
			.setEmoji("⬅️")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page === 0),
		new ButtonBuilder()
			.setCustomId(`${QUEUE_PAGE_ID}:${page}:refresh`)
			.setEmoji("🔄")
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(`${QUEUE_PAGE_ID}:${page + 1}`)
			.setEmoji("➡️")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page >= pages - 1),
	);

	return { content: "", embeds: [embed], components: [row] };
}
