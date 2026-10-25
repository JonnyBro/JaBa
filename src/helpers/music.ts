import { capitalizeString, convertTime, shortenString, translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { notifyMusicChange } from "@/helpers/music-events.js";
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
	ButtonBuilder,
	ButtonStyle,
	Guild,
	GuildMember,
	Interaction,
	Message,
	MessageCreateOptions,
	MessageFlags,
	User,
} from "discord.js";
import {
	Player,
	RepeatMode,
	SearchPlatform,
	SearchResult,
	Track,
	UnresolvedSearchResult,
	UnresolvedTrack,
} from "lavalink-client";

export const MUSIC_CONTROL_ID = "MUSIC_CTRL";
export const MAX_VOLUME = 150;

export type Translate = (key: string, args?: Record<string, unknown>) => Promise<string>;

const NOW_PLAYING_KEY = "nowPlayingMessage";
const AUTOPLAY_KEY = "autoplay";
const EMPTY_CHANNEL_TIMEOUT = 60_000;

export const SEARCH_SOURCES = {
	ytm: "ytmsearch",
	yt: "ytsearch",
	ym: "ymsearch",
	sp: "spsearch",
	sc: "scsearch",
} satisfies Record<string, SearchPlatform>;

export type SearchSource = keyof typeof SEARCH_SOURCES;

const emptyChannelTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const checkVoice = (member: GuildMember, player?: Player) => {
	if (!member.voice.channelId) return "music/play:NO_VOICE_CHANNEL";
	if (player && player.voiceChannelId !== member.voice.channelId) return "music/play:NOT_SAME_CHANNEL";

	return null;
};

export const getControllablePlayer = (interaction: Interaction) => {
	const client = useClient();
	const player = interaction.guildId ? client.lavalink.getPlayer(interaction.guildId) : undefined;

	if (!player || !player.queue.current) return { player: null, error: "music/play:NOT_PLAYING" };

	const error = checkVoice(interaction.member as GuildMember, player);

	return { player: error ? null : player, error };
};

const isLoadFailed = (res: SearchResult | UnresolvedSearchResult) =>
	res.loadType === "error" || res.loadType === "empty" || !res.tracks.length;

type PlayerTarget = {
	guildId: string;
	textChannelId: string;
	voiceChannelId: string;
};

const getOrCreatePlayer = ({ guildId, textChannelId, voiceChannelId }: PlayerTarget) => {
	const client = useClient();

	return (
		client.lavalink.getPlayer(guildId) ||
		client.lavalink.createPlayer({ guildId, textChannelId, voiceChannelId, volume: 100, selfDeaf: true })
	);
};

const enqueue = async (player: Player, tracks: (Track | UnresolvedTrack)[], next?: boolean) => {
	if (next) await player.queue.splice(0, 0, ...tracks);
	else await player.queue.add(tracks);

	if (!player.connected) await player.connect();
	if (!player.playing && !player.paused) await player.play();
};

/** Queues tracks that are already resolved, like the ones from a saved playlist */
export const addTracks = async ({ tracks, next, ...target }: PlayerTarget & { tracks: Track[]; next?: boolean }) => {
	if (!useClient().lavalink.useable) return "music/play:NODE_UNAVAILABLE";

	await enqueue(getOrCreatePlayer(target), tracks, next);

	return null;
};

type AddToQueueOptions = PlayerTarget & {
	requester: User;
	query: string;
	source?: SearchSource;
	next?: boolean;
};

export const addToQueue = async ({ requester, query, source, next, ...target }: AddToQueueOptions) => {
	const client = useClient();
	const { guildId } = target;

	if (!client.lavalink.useable) return { res: null, error: "music/play:NODE_UNAVAILABLE" };

	const player = getOrCreatePlayer(target);
	const res = await player.search({ query, source: source ? SEARCH_SOURCES[source] : undefined }, requester);

	if (isLoadFailed(res)) {
		if (res.exception)
			logger.warn(
				`[Lavalink] Failed to load "${query}" in ${guildId}: ${res.exception.message}\n`,
				`Cause: ${res.exception.cause}`,
			);
		else logger.debug(`[Lavalink] Nothing found for "${query}" in ${guildId} (loadType: ${res.loadType})`);

		if (!player.queue.current && !player.queue.tracks.length) await player.destroy("nothing found", true);

		return {
			res: null,
			error: res.exception ? "music/play:LOAD_FAILED" : "music/play:NO_RESULT",
			exception: res.exception,
		};
	}

	await enqueue(player, res.loadType === "playlist" ? res.tracks : [res.tracks[0]], next);

	return { res, error: "misc:UNKNOWN_ERROR" };
};

/** Searches without a player, for things like saving tracks to a playlist */
export const searchTracks = async (query: string, requester: User, source?: SearchSource) => {
	const node = useClient().lavalink.nodeManager.leastUsedNodes("playingPlayers")[0];
	if (!node) return { res: null, error: "music/play:NODE_UNAVAILABLE" };

	const res = await node.search({ query, source: SEARCH_SOURCES[source || "ytm"] }, requester);
	if (isLoadFailed(res))
		return { res: null, error: res.exception ? "music/play:LOAD_FAILED" : "music/play:NO_RESULT" };

	return { res, error: null };
};

const SOURCE_NAMES: Record<string, string> = {
	youtube: "YouTube",
	youtubemusic: "YouTube Music",
	soundcloud: "SoundCloud",
	spotify: "Spotify",
	yandexmusic: "Yandex Music",
	deezer: "Deezer",
	applemusic: "Apple Music",
	bandcamp: "Bandcamp",
	twitch: "Twitch",
	vimeo: "Vimeo",
	http: "HTTP",
	local: "Local",
};

export const formatSource = (source: string) => SOURCE_NAMES[source.toLowerCase()] ?? capitalizeString(source);

export const formatTrack = (track: Track, maxTitle = 50) => {
	const title = shortenString(track.info.title || "Unknown", maxTitle);
	const author = shortenString((track.info.author || "Unknown").replace(/ - Topic$/, ""), 30);
	const text = `${title} - ${author}`;

	return track.info.uri && /^https?:\/\//.test(track.info.uri) ? `[${text}](<${track.info.uri}>)` : text;
};

export const formatDuration = (track: Track) => (track.info.isStream ? "🔴 LIVE" : convertTime(track.info.duration));

// Player controls, shared by the now playing buttons and the dashboard
export type PlayerAction = "pause" | "back" | "skip" | "stop" | "voldown" | "volup" | "loop" | "shuffle" | "autoplay";

/** These start another track or destroy the player, which sends or deletes the now playing message on its own */
export const TRACK_CHANGING_ACTIONS: PlayerAction[] = ["back", "skip", "stop"];

export const nextRepeatMode: Record<RepeatMode, RepeatMode> = {
	off: "track",
	track: "queue",
	queue: "off",
};

/** Returns a locale key to show when the action can't be done */
export const runPlayerAction = async (player: Player, action: PlayerAction): Promise<string | null> => {
	switch (action) {
		case "pause":
			if (player.paused) await player.resume();
			else await player.pause();
			return null;

		case "back": {
			const previous = player.queue.previous[0];
			if (!previous) return "music/back:NO_PREV_SONG";

			await player.queue.previous.shift();
			await player.play({ clientTrack: previous });
			return null;
		}

		case "skip":
			if (!player.queue.tracks.length && !isAutoplayEnabled(player)) return "music/queue:NO_QUEUE";

			if (player.queue.tracks.length) await player.skip();
			else await player.stopPlaying(false, true);
			return null;

		case "stop":
			await player.destroy("stopped by user", true);
			return null;

		case "voldown":
			await player.setVolume(Math.max(player.volume - 10, 0));
			return null;

		case "volup":
			await player.setVolume(Math.min(player.volume + 10, MAX_VOLUME));
			return null;

		case "loop":
			await player.setRepeatMode(nextRepeatMode[player.repeatMode]);
			return null;

		case "shuffle":
			if (!player.queue.tracks.length) return "music/queue:NO_QUEUE";

			await player.queue.shuffle();
			return "music/shuffle:SUCCESS";

		case "autoplay":
			setAutoplay(player, !isAutoplayEnabled(player));
			return null;
	}
};

// Autoplay
export const isAutoplayEnabled = (player: Player) => !!player.getData<boolean>(AUTOPLAY_KEY);

export const setAutoplay = (player: Player, enabled: boolean) => {
	player.setData(AUTOPLAY_KEY, enabled);
	notifyMusicChange(player.guildId);
};

const getRadioQuery = async (player: Player, track: Track) => {
	const client = useClient();

	if (track.info.sourceName === "youtube")
		return `https://www.youtube.com/watch?v=${track.info.identifier}&list=RD${track.info.identifier}`;

	if (track.info.sourceName === "yandexmusic") return `ymrec:${track.info.identifier}`;

	// Spotify recommendations are not available for new apps, so find the track on YouTube and use its mix
	const res = await player.search(
		{ query: `${track.info.title} ${track.info.author}`, source: "ytmsearch" },
		client.user,
	);
	const found = res.tracks[0];
	if (!found) return null;

	return `https://www.youtube.com/watch?v=${found.info.identifier}&list=RD${found.info.identifier}`;
};

export const autoPlayFunction = async (player: Player, lastTrack: Track) => {
	if (!isAutoplayEnabled(player) || !lastTrack) return;

	const client = useClient();

	try {
		const query = await getRadioQuery(player, lastTrack);
		if (!query) return;

		const res = await player.search(query, client.user);
		if (isLoadFailed(res)) return;

		const playedIds = new Set([lastTrack, ...player.queue.previous].map(t => t.info.identifier));
		const candidates = (res.tracks as Track[]).filter(t => !playedIds.has(t.info.identifier));

		await player.queue.add(candidates.slice(0, 5));

		logger.debug(`[Lavalink] Autoplay added ${Math.min(candidates.length, 5)} track(s) in ${player.guildId}`);
	} catch (error) {
		logger.error("[Lavalink] Autoplay failed:", error);
	}
};

// Leave Empty Channels
export const isChannelEmpty = (guild: Guild, channelId: string) => {
	const channel = guild.channels.cache.get(channelId);
	if (!channel?.isVoiceBased()) return true;

	return !channel.members.some(member => !member.user.bot);
};

export const checkEmptyChannel = (player: Player) => {
	const client = useClient();
	const guild = client.guilds.cache.get(player.guildId);
	if (!guild || !player.voiceChannelId) return;

	const timer = emptyChannelTimers.get(player.guildId);

	if (!isChannelEmpty(guild, player.voiceChannelId)) {
		if (timer) clearTimeout(timer);
		emptyChannelTimers.delete(player.guildId);

		return;
	}

	if (timer) return;

	emptyChannelTimers.set(
		player.guildId,
		setTimeout(async () => {
			emptyChannelTimers.delete(player.guildId);

			const current = client.lavalink.getPlayer(player.guildId);
			if (!current?.voiceChannelId || !isChannelEmpty(guild, current.voiceChannelId)) return;

			await sendToPlayerChannel(current, await translateContext(guild, "music/play:STOP_EMPTY"));
			await current.destroy("voice channel is empty", true);
		}, EMPTY_CHANNEL_TIMEOUT),
	);
};

export const clearEmptyChannelTimer = (guildId: string) => {
	const timer = emptyChannelTimers.get(guildId);
	if (timer) clearTimeout(timer);

	emptyChannelTimers.delete(guildId);
};

// Messages
export const sendToPlayerChannel = async (player: Player, content: string | MessageCreateOptions) => {
	const client = useClient();
	const channel = player.textChannelId ? client.channels.cache.get(player.textChannelId) : null;
	if (!channel?.isSendable()) return null;

	return channel.send(content).catch(error => {
		logger.warn(`[Lavalink] Can't send a message to ${player.textChannelId}:`, error.message);

		return null;
	});
};

export const deleteNowPlaying = async (player: Player) => {
	const message = player.getData<Message | undefined>(NOW_PLAYING_KEY);
	player.deleteData(NOW_PLAYING_KEY);

	if (message?.deletable) await message.delete().catch(() => {});
};

export const formatPlayerSettings = async (player: Player, t: Translate) =>
	t("music/queue:SETTINGS_VALUE", {
		volume: player.volume,
		loop: await t(`music/loop:MODE_${player.repeatMode.toUpperCase()}`),
		autoplay: await t(isAutoplayEnabled(player) ? "common:ENABLED" : "common:DISABLED"),
	});

const buildNowPlaying = async (player: Player, track: Track) => {
	const client = useClient();
	const guild = client.guilds.cache.get(player.guildId)!;
	const t: Translate = (key, args) => translateContext(guild, key, args);

	const requester = track.requester as User | { id?: string } | undefined;
	const requesterMention =
		requester instanceof User
			? requester.toString()
			: requester?.id
				? `<@${requester.id}>`
				: await t("common:UNKNOWN");
	const status = player.paused ? `⏸️ ${await t("music/queue:PAUSED")}` : `▶️ ${await t("music/queue:PLAYING")}`;
	const nextTrack = player.queue.tracks[0] as Track | undefined;

	const container = createContainer();

	addTextWithThumbnail(
		container,
		[
			`-# ${status}`,
			`### ${formatTrack(track, 60)}`,
			[
				`\`${formatDuration(track)}\``,
				formatSource(track.info.sourceName),
				`${await t("music/queue:ADDED")}: ${requesterMention}`,
			].join(" • "),
		].join("\n"),
		track.info.artworkUrl,
	);

	container.addSeparatorComponents(createSeparator());
	container.addTextDisplayComponents(createText(await formatPlayerSettings(player, t)));

	if (nextTrack)
		container.addTextDisplayComponents(createText(`**${await t("music/queue:NEXT")}:** ${formatTrack(nextTrack)}`));

	const button = (action: string, emoji: string, style = ButtonStyle.Secondary) =>
		new ButtonBuilder().setCustomId(`${MUSIC_CONTROL_ID}:${action}`).setEmoji(emoji).setStyle(style);

	const loopEmoji = { off: "🔁", queue: "🔁", track: "🔂" }[player.repeatMode];

	container
		.addSeparatorComponents(createSeparator(false))
		.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				button("back", "⏮️"),
				player.paused ? button("pause", "▶️", ButtonStyle.Primary) : button("pause", "⏸️"),
				button("skip", "⏭️"),
				button("stop", "⏹️", ButtonStyle.Danger),
			),
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				button("voldown", "🔉"),
				button("volup", "🔊"),
				button("loop", loopEmoji, player.repeatMode === "off" ? ButtonStyle.Secondary : ButtonStyle.Primary),
				button("shuffle", "🔀"),
				button("autoplay", "♾️", isAutoplayEnabled(player) ? ButtonStyle.Primary : ButtonStyle.Secondary),
			),
		)
		.addTextDisplayComponents(createFooter());

	// Unlike embeds, mentions inside text displays do ping
	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [container],
		allowedMentions: { parse: [] },
	};
};

export const sendNowPlaying = async (player: Player, track: Track) => {
	await deleteNowPlaying(player);

	const message = await sendToPlayerChannel(player, await buildNowPlaying(player, track));
	if (message) player.setData(NOW_PLAYING_KEY, message);

	return message;
};

export const updateNowPlaying = async (player: Player) => {
	const message = player.getData<Message | undefined>(NOW_PLAYING_KEY);
	const track = player.queue.current;
	if (!message || !track) return;

	await message.edit(await buildNowPlaying(player, track)).catch(() => {});
};
