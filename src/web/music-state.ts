import { isAutoplayEnabled, MAX_VOLUME } from "@/helpers/music.js";
import useClient from "@/utils/use-client.js";
import { Guild, User } from "discord.js";
import { Track, UnresolvedTrack } from "lavalink-client";

const MAX_QUEUE_ITEMS = 100;

const serializeUser = (user: User) => ({
	id: user.id,
	name: user.globalName ?? user.username,
	avatar: user instanceof User ? user.displayAvatarURL() : null,
});

const serializeTrack = (track: Track | UnresolvedTrack) => {
	const requester = track.requester as User | undefined;

	return {
		title: track.info.title ?? "Unknown",
		author: (track.info.author ?? "Unknown").replace(/ - Topic$/, ""),
		uri: track.info.uri ?? null,
		artworkUrl: track.info.artworkUrl ?? null,
		duration: track.info.duration ?? 0,
		isStream: !!track.info.isStream,
		sourceName: track.info.sourceName ?? null,
		requester: requester ? serializeUser(requester) : null,
	};
};

/** The player state as one user sees it, canControl depends on their voice channel */
export const getMusicState = (guild: Guild, userId: string) => {
	const player = useClient().lavalink.getPlayer(guild.id);
	const userChannelId = guild.voiceStates.cache.get(userId)?.channelId ?? null;
	const userChannel = userChannelId ? guild.channels.cache.get(userChannelId) : null;
	const base = {
		timestamp: Date.now(),
		maxVolume: MAX_VOLUME,
		userVoiceChannel: userChannel ? { id: userChannel.id, name: userChannel.name } : null,
	};

	if (!player?.queue.current) return { ...base, active: false as const, canStart: !!userChannel };

	const voiceChannel = player.voiceChannelId ? guild.channels.cache.get(player.voiceChannelId) : null;
	const tracks = player.queue.tracks;

	return {
		...base,
		active: true as const,
		canControl: !!userChannelId && userChannelId === player.voiceChannelId,
		voiceChannel: voiceChannel ? { id: voiceChannel.id, name: voiceChannel.name } : null,
		current: serializeTrack(player.queue.current),
		position: player.position,
		paused: player.paused,
		volume: player.volume,
		repeatMode: player.repeatMode,
		autoplay: isAutoplayEnabled(player),
		hasPrevious: player.queue.previous.length > 0,
		queue: tracks.slice(0, MAX_QUEUE_ITEMS).map(serializeTrack),
		queueTotal: tracks.length,
		queueDuration: tracks.reduce((sum, track) => sum + (track.info.duration ?? 0), 0),
	};
};
