import logger from "@/helpers/logger.js";
import { LyricsResult } from "lavalink-client";

const LRCLIB_URL = "https://lrclib.net/api";
const USER_AGENT = "JaBa (https://github.com/JonnyBro/JaBa)";
const REQUEST_TIMEOUT = 8000;
/** How far the found song's length may be from the track's, in seconds */
const DURATION_TOLERANCE = 10;

export type Lyrics = { source: string; synced: boolean; lines: { time: number; text: string }[]; text: string | null };

type TrackInfo = { title: string; author: string; duration: number };

type LrclibEntry = {
	trackName: string;
	artistName: string;
	duration: number;
	instrumental: boolean;
	plainLyrics: string | null;
	syncedLyrics: string | null;
};

export const fromLavalink = (result: LyricsResult | null): Lyrics | null => {
	if (!result) return null;

	const lines = result.lines.map(line => ({ time: line.timestamp, text: line.line }));
	// Plain lyrics from some sources still come as lines, all at 0
	const synced = lines.some(line => line.time > 0);
	const text = result.text?.trim() || (synced ? null : lines.map(line => line.text).join("\n")) || null;

	if (!synced && !text) return null;

	return { source: result.provider || result.sourceName, synced, lines: synced ? lines : [], text };
};

export const lyricsText = (lyrics: Lyrics) => (lyrics.text ?? lyrics.lines.map(line => line.text).join("\n")).trim();

// Words that YouTube uploads add to titles but songs don't have
const NOISE_WORDS =
	"official|lyrics?|audio|video|music|clip|mv|hd|hq|4k|visuali[sz]er|remaster(?:ed)?|live|explicit|" +
	"премьера|клип|текст|караоке";
const NOISE_BRACKETS = new RegExp(`[([【][^)\\]】]*(?:${NOISE_WORDS})[^)\\]】]*[)\\]】]`, "gi");
const FEATURING = /\s*[([]?\b(?:feat\.?|ft\.?|featuring|при уч\.?)\s[^)\]]*[)\]]?/gi;
const AUTHOR_NOISE = /\s*(?:-\s*topic|vevo|official|music)\s*$/gi;
const SEPARATOR = /\s+[-–—|]\s+/;

const tidy = (text: string) =>
	text
		.replace(NOISE_BRACKETS, "")
		.replace(FEATURING, "")
		.replace(/["«»“”]/g, "")
		.replace(/\s{2,}/g, " ")
		.trim();

/** Splits "Artist - Song (Official Video)" by "ArtistVEVO" into a clean artist and title */
export const cleanTrack = ({ title, author }: Pick<TrackInfo, "title" | "author">) => {
	const cleanTitle = tidy(title);
	const cleanAuthor = tidy(author.replace(AUTHOR_NOISE, "")) || null;

	const parts = cleanTitle.split(SEPARATOR);
	if (parts.length >= 2) return { artist: parts[0], title: parts.slice(1).join(" ") };

	return { artist: cleanAuthor, title: cleanTitle };
};

const parseSynced = (lrc: string) =>
	lrc
		.split("\n")
		.map(line => line.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s?(.*)$/))
		.filter((match): match is RegExpMatchArray => !!match)
		.map(([, minutes, seconds, text]) => ({
			time: Math.round((Number(minutes) * 60 + Number(seconds)) * 1000),
			text,
		}));

const lrclibSearch = async (params: Record<string, string>) => {
	const response = await fetch(`${LRCLIB_URL}/search?${new URLSearchParams(params)}`, {
		headers: { "User-Agent": USER_AGENT },
		signal: AbortSignal.timeout(REQUEST_TIMEOUT),
	});
	if (!response.ok) throw new Error(`LRCLIB answered ${response.status}`);

	return (await response.json()) as LrclibEntry[];
};

/** The closest in length wins, synced lyrics break ties */
const pickBest = (entries: LrclibEntry[], duration: number | null) =>
	entries
		.filter(entry => !entry.instrumental && (entry.syncedLyrics || entry.plainLyrics))
		.map(entry => ({ entry, diff: duration === null ? 0 : Math.abs(entry.duration - duration) }))
		.filter(({ diff }) => diff <= DURATION_TOLERANCE)
		.sort((a, b) => a.diff - b.diff || Number(!!b.entry.syncedLyrics) - Number(!!a.entry.syncedLyrics))[0]?.entry;

/** Asks LRCLIB directly with a cleaned up title, tries narrower searches first */
export const searchLrclib = async (track: TrackInfo, query?: string | null): Promise<Lyrics | null> => {
	const { artist, title } = cleanTrack(track);
	// Streams and some sources have no length, then any length goes
	const duration = track.duration > 0 ? track.duration / 1000 : null;

	const searches: Record<string, string>[] = [];
	// LRCLIB names its search fields in snake case
	if (artist) searches.push({ ["track_name"]: title, ["artist_name"]: artist }, { q: `${artist} ${title}` });
	searches.push({ q: title });
	if (query) searches.push({ q: query });

	for (const params of searches) {
		const best = pickBest(await lrclibSearch(params), duration);
		if (!best) continue;

		const lines = best.syncedLyrics ? parseSynced(best.syncedLyrics) : [];

		return {
			source: "LRCLIB",
			synced: lines.length > 0,
			lines,
			text: best.plainLyrics?.trim() || null,
		};
	}

	return null;
};

export class LyricsUnavailableError extends Error {}

/**
 * Lavalink's LavaLyrics goes first, it knows Yandex Music and YouTube.
 * It searches with the raw title though, so LRCLIB is asked again with a clean one
 * when Lavalink finds nothing or only plain text
 */
export const findLyrics = async (
	track: TrackInfo,
	askLavalink: () => Promise<LyricsResult | null>,
	query?: string | null,
) => {
	let lavalink: Lyrics | null = null;
	let lavalinkFailed = false;

	try {
		lavalink = fromLavalink(await askLavalink());
	} catch (error) {
		// lavalink-client throws when the node has no LavaLyrics plugin
		lavalinkFailed = true;
		logger.warn("[Lyrics] Lavalink couldn't get lyrics, is the LavaLyrics plugin installed?", error);
	}

	if (lavalink?.synced) return lavalink;

	const lrclib = await searchLrclib(track, query).catch(error => {
		logger.warn("[Lyrics] LRCLIB search failed:", error);
		return undefined;
	});

	if (lrclib?.synced) return lrclib;
	if (lavalink || lrclib) return lavalink ?? lrclib!;
	if (lavalinkFailed && lrclib === undefined) throw new LyricsUnavailableError();

	return null;
};
