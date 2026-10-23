import logger from "@/helpers/logger.js";
import { isAutoplayEnabled, isChannelEmpty, sendNowPlaying, setAutoplay } from "@/helpers/music.js";
import LavalinkSessionModel from "@/models/LavalinkSessionModel.js";
import PlayerStateModel, { SavedTrack } from "@/models/PlayerStateModel.js";
import useClient from "@/utils/use-client.js";
import { User } from "discord.js";
import { LavalinkNode, LavalinkPlayer, Player, Track, UnresolvedTrack } from "lavalink-client";

const DEFAULT_RESUME_TIMEOUT_MINUTES = 10;

const getResumeTimeoutSeconds = () => {
	const minutes = Number(
		useClient().configService.get<string>("MUSIC_RESUME_TIMEOUT") || DEFAULT_RESUME_TIMEOUT_MINUTES,
	);

	return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : 0;
};

const serializeTrack = (track: Track | UnresolvedTrack): SavedTrack | null => {
	if (!track.encoded) return null;

	return {
		encoded: track.encoded,
		info: track.info as Track["info"],
		pluginInfo: track.pluginInfo,
		userData: track.userData,
		requesterId: (track.requester as User | undefined)?.id,
	};
};

const fetchRequester = async (id?: string | null) => {
	const client = useClient();

	return (id && (await client.users.fetch(id).catch(() => null))) || client.user;
};

export const savePlayerState = async (player: Player, nowPlayingMessageId?: string) => {
	if (!player.voiceChannelId || !player.textChannelId) return;

	await PlayerStateModel.updateOne(
		{ guildId: player.guildId },
		{
			nodeId: player.node.id,
			voiceChannelId: player.voiceChannelId,
			textChannelId: player.textChannelId,
			nowPlayingMessageId: nowPlayingMessageId || null,
			repeatMode: player.repeatMode,
			autoplay: isAutoplayEnabled(player),
			currentRequesterId: (player.queue.current?.requester as User | undefined)?.id || null,
			queue: player.queue.tracks.map(serializeTrack).filter(track => track !== null),
		},
		{ upsert: true },
	).catch(error => logger.warn(`[Lavalink] Failed to save player state in ${player.guildId}:`, error));
};

export const deletePlayerState = (guildId: string) =>
	PlayerStateModel.deleteOne({ guildId }).catch(error =>
		logger.warn(`[Lavalink] Failed to delete player state in ${guildId}:`, error),
	);

// Must run before lavalink.init(), the node sends the stored session id when it connects
export const applySavedSessions = async () => {
	if (!getResumeTimeoutSeconds()) return;

	for (const node of useClient().lavalink.nodeManager.nodes.values()) {
		const saved = await LavalinkSessionModel.findOne({ nodeId: node.id }).catch(() => null);
		if (saved) node.options.sessionId = saved.sessionId;
	}
};

export const handleNodeReady = async (node: LavalinkNode, sessionId: string, resumed: boolean) => {
	// The raw event fires before the library stores the id itself, but updateSession() needs it.
	// Keep it in the options too, the library reconnects with it
	node.sessionId = sessionId;
	node.options.sessionId = sessionId;

	await LavalinkSessionModel.updateOne({ nodeId: node.id }, { sessionId }, { upsert: true }).catch(error =>
		logger.warn(`[Lavalink] Failed to save session of node "${node.id}":`, error),
	);

	if (!resumed) await PlayerStateModel.deleteMany({ nodeId: node.id }).catch(() => {});

	const timeout = getResumeTimeoutSeconds();

	await node
		.updateSession(timeout > 0, timeout || undefined)
		.catch(error => logger.warn(`[Lavalink] Failed to configure resuming on node "${node.id}":`, error));

	logger.debug(`[Lavalink] Node "${node.id}" session ${sessionId} (resumed: ${resumed}, timeout: ${timeout}s)`);
};

const discardPlayer = async (node: LavalinkNode, guildId: string, reason: string) => {
	await node.destroyPlayer(guildId).catch(() => {});
	await deletePlayerState(guildId);

	logger.debug(`[Lavalink] Not restoring player in ${guildId}: ${reason}`);
};

const deleteOldNowPlaying = async (textChannelId: string, messageId: string | null) => {
	if (!messageId) return;

	const channel = useClient().channels.cache.get(textChannelId);
	if (!channel?.isTextBased()) return;

	await channel.messages.delete(messageId).catch(() => {});
};

const restorePlayer = async (node: LavalinkNode, data: LavalinkPlayer) => {
	const client = useClient();

	// The node can also resume after a short drop while the bot kept running
	if (client.lavalink.getPlayer(data.guildId)) return;

	const state = await PlayerStateModel.findOne({ guildId: data.guildId });
	const guild = client.guilds.cache.get(data.guildId);

	if (!state || !guild) return discardPlayer(node, data.guildId, "no saved state");
	if (isChannelEmpty(guild, state.voiceChannelId)) return discardPlayer(node, data.guildId, "voice channel is empty");
	if (!data.track && !state.queue.length) return discardPlayer(node, data.guildId, "nothing to play");

	const player = client.lavalink.createPlayer({
		guildId: data.guildId,
		voiceChannelId: state.voiceChannelId,
		textChannelId: state.textChannelId,
		node: node.id,
		volume: data.volume,
		selfDeaf: true,
	});

	player.repeatMode = state.repeatMode;
	setAutoplay(player, state.autoplay);

	await player.connect();

	const tracks = await Promise.all(
		state.queue.map(async ({ requesterId, ...track }) =>
			client.lavalink.utils.buildTrack(track, await fetchRequester(requesterId)),
		),
	);

	await player.queue.add(tracks);
	await deleteOldNowPlaying(state.textChannelId, state.nowPlayingMessageId);

	// Events missed while the bot was down are replayed by Lavalink, so the track may have already ended
	if (!data.track) {
		await player.play();
		logger.info(`[Lavalink] Restored player in ${data.guildId} from the next track`);

		return;
	}

	player.queue.current = client.lavalink.utils.buildTrack(data.track, await fetchRequester(state.currentRequesterId));
	player.paused = data.paused;
	player.playing = !data.paused;
	player.lastPosition = data.state.position;
	player.lastPositionChange = Date.now();

	const message = await sendNowPlaying(player, player.queue.current);
	await savePlayerState(player, message?.id);

	logger.info(`[Lavalink] Restored player in ${data.guildId}`);
};

export const restorePlayers = async (node: LavalinkNode, players: LavalinkPlayer[]) => {
	for (const data of players)
		await restorePlayer(node, data).catch(error =>
			logger.error(`[Lavalink] Failed to restore player in ${data.guildId}:`, error),
		);
};
