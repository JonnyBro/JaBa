import { editReplyError, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { formatTrack, searchTracks } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
	InteractionContextType,
	MessageFlags,
} from "discord.js";
import { LyricsResult, Track } from "lavalink-client";

const client = useClient();

const LYRICS_PAGE_ID = "MUSIC_LYRICS";
// Discord allows 4000 characters of text in a whole Components V2 message, the rest goes to the header
const PAGE_LENGTH = 3400;
const PAGES_TTL = 30 * 60 * 1000;

type LyricsPages = { title: string; source: string; pages: string[] };

// Lyrics aren't stored anywhere, so pages live only as long as the bot does
const lyricsPages = new Map<string, LyricsPages>();

export const data: CommandData = {
	name: "lyrics",
	...getLocalizedDesc("music/lyrics:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "query",
			...getLocalizedDesc("music/lyrics:QUERY"),
			type: ApplicationCommandOptionType.String,
		},
	],
};

const lyricsText = (lyrics: LyricsResult) => (lyrics.text ?? lyrics.lines.map(line => line.line).join("\n")).trim();

const paginate = (text: string) => {
	const pages: string[] = [];
	let page = "";

	for (const line of text.split("\n")) {
		if (page && page.length + line.length + 1 > PAGE_LENGTH) {
			pages.push(page);
			page = "";
		}

		page += (page ? "\n" : "") + line.slice(0, PAGE_LENGTH);
	}

	if (page) pages.push(page);

	return pages;
};

const buildPage = async (interaction: Interaction, id: string, data: LyricsPages, page: number) => {
	const container = createContainer()
		.addTextDisplayComponents(createText(`## ${data.title}`))
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(data.pages[page]));

	if (data.pages.length > 1)
		container.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`${LYRICS_PAGE_ID}:${id}:${page - 1}`)
					.setEmoji("⬅️")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(page === 0),
				new ButtonBuilder()
					.setCustomId(`${LYRICS_PAGE_ID}:${id}:${page + 1}`)
					.setEmoji("➡️")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(page === data.pages.length - 1),
			),
		);

	const footer = await translateContext(interaction, "music/lyrics:FOOTER", {
		source: data.source,
		page: page + 1,
		pages: data.pages.length,
	});

	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [container.addTextDisplayComponents(createFooter(footer))],
		allowedMentions: { parse: [] },
	};
};

const fetchLyrics = async (guildId: string, query: string | null) => {
	if (!query) {
		const player = client.lavalink.getPlayer(guildId);
		const track = player?.queue.current as Track | undefined;
		if (!player || !track) return { error: "music/play:NOT_PLAYING" };

		return { track, lyrics: await player.getCurrentLyrics() };
	}

	const { res, error } = await searchTracks(query, client.user);
	const track = res?.tracks[0] as Track | undefined;
	if (!track) return { error: error ?? "music/play:NO_RESULT" };

	const node = client.lavalink.nodeManager.leastUsedNodes("playingPlayers")[0];

	return { track, lyrics: await node.lyrics.get(track) };
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const query = interaction.options.getString("query");

	let result: Awaited<ReturnType<typeof fetchLyrics>>;
	try {
		result = await fetchLyrics(interaction.guildId!, query);
	} catch (error) {
		// lavalink-client throws when the node has no LavaLyrics plugin
		logger.warn("[Lyrics] Lavalink couldn't get lyrics, is the LavaLyrics plugin installed?", error);
		return editReplyError(interaction, "music/lyrics:UNAVAILABLE");
	}

	if ("error" in result) return editReplyError(interaction, result.error!, { query });

	const text = result.lyrics && lyricsText(result.lyrics);
	if (!text) return editReplyError(interaction, "music/lyrics:NOT_FOUND", { track: formatTrack(result.track) });

	const data: LyricsPages = {
		title: formatTrack(result.track, 80),
		source: result.lyrics!.provider || result.lyrics!.sourceName,
		pages: paginate(text),
	};

	// Buttons point to the interaction id, unlike the message id it is known before the reply is sent
	lyricsPages.set(interaction.id, data);
	setTimeout(() => lyricsPages.delete(interaction.id), PAGES_TTL);

	await interaction.editReply(await buildPage(interaction, interaction.id, data, 0));
};

componentRouter.register(LYRICS_PAGE_ID, async interaction => {
	if (!interaction.isButton()) return;

	const [, id, pageText] = interaction.customId.split(":");
	const data = lyricsPages.get(id);

	if (!data) {
		await interaction.reply({
			content: await translateContext(interaction, "music/lyrics:EXPIRED"),
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const page = Math.min(Math.max(Number(pageText), 0), data.pages.length - 1);
	await interaction.update(await buildPage(interaction, id, data, page));
});
