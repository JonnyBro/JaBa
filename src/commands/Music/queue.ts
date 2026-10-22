import { convertTime, editReplyError, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { formatDuration, formatPlayerSettings, formatTrack, Translate } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import {
	addTextWithThumbnail,
	createContainer,
	createFooter,
	createSeparator,
	createText,
} from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
	InteractionContextType,
	MessageFlags,
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
		await interaction.update(await buildNotPlaying(interaction));

		return;
	}

	const page = Number(interaction.customId.split(":")[1]) || 0;

	await interaction.update(await buildQueuePage(interaction, player, page));
});

const PROGRESS_BAR_SIZE = 12;

const progressBar = (position: number, duration: number) => {
	const filled = duration ? Math.round((Math.min(position, duration) / duration) * PROGRESS_BAR_SIZE) : 0;

	return `${"▰".repeat(filled)}${"▱".repeat(PROGRESS_BAR_SIZE - filled)}`;
};

const buildNotPlaying = async (interaction: Interaction) => ({
	flags: MessageFlags.IsComponentsV2 as const,
	components: [
		createContainer().addTextDisplayComponents(
			createText(await translateContext(interaction, "music/play:NOT_PLAYING")),
		),
	],
});

async function buildQueuePage(interaction: Interaction, player: Player, page: number) {
	const t: Translate = (key, args) => translateContext(interaction, key, args);

	const current = player.queue.current!;
	const tracks = player.queue.tracks as Track[];
	const pages = Math.max(1, Math.ceil(tracks.length / PAGE_SIZE));
	page = Math.min(Math.max(page, 0), pages - 1);

	const lines = tracks
		.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
		.map((track, i) => `\`${page * PAGE_SIZE + i + 1}.\` ${formatTrack(track)} \`${formatDuration(track)}\``);

	const remaining = Math.max(0, current.info.duration - player.position);
	const totalDuration = tracks.reduce((acc, track) => acc + (track.info.duration || 0), remaining);

	const duration = convertTime(current.info.duration);
	const position = current.info.isStream
		? formatDuration(current)
		: `${progressBar(player.position, current.info.duration)} \`${convertTime(player.position)} / ${duration}\``;

	const status = player.paused
		? `⏸️ ${await t("music/queue:PAUSED")}`
		: `▶️ ${await t("music/queue:CURRENTLY_PLAYING")}`;

	const container = createContainer().addTextDisplayComponents(createText(`## ${await t("music/queue:QUEUE")}`));

	addTextWithThumbnail(
		container,
		[`-# ${status}`, `**${formatTrack(current)}**`, position].join("\n"),
		current.info.artworkUrl,
	);

	const button = (customId: string, emoji: string, disabled = false) =>
		new ButtonBuilder().setCustomId(customId).setEmoji(emoji).setStyle(ButtonStyle.Secondary).setDisabled(disabled);

	container
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(`**${await t("music/queue:NEXT")}:**\n${lines.join("\n") || (await t("music/queue:NO_QUEUE"))}`),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(await formatPlayerSettings(player, t)))
		.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				button(`${QUEUE_PAGE_ID}:${page - 1}`, "⬅️", page === 0),
				button(`${QUEUE_PAGE_ID}:${page}:refresh`, "🔄"),
				button(`${QUEUE_PAGE_ID}:${page + 1}`, "➡️", page >= pages - 1),
			),
		)
		.addTextDisplayComponents(
			createFooter(
				`${await t("common:PAGE")} ${page + 1}/${pages} • ${await t("music/queue:TOTAL", {
					count: tracks.length,
					time: convertTime(totalDuration),
				})}`,
			),
		);

	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [container],
		allowedMentions: { parse: [] },
	};
}
