import { translateContext } from "@/helpers/functions.js";
import { notifyMusicChange } from "@/helpers/music-events.js";
import {
	addToQueue,
	checkVoice,
	MAX_VOLUME,
	PlayerAction,
	runPlayerAction,
	SEARCH_SOURCES,
	SearchSource,
	TRACK_CHANGING_ACTIONS,
	updateNowPlaying,
} from "@/helpers/music.js";
import useClient from "@/utils/use-client.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Player } from "lavalink-client";
import { subscribe } from "../../music-hub.js";
import { getMusicState } from "../../music-state.js";
import { fail, send } from "../../utils.js";

const PLAYER_ACTIONS: PlayerAction[] = ["pause", "back", "skip", "stop", "loop", "shuffle", "autoplay"];
const MAX_QUERY = 500;

const failWith = async (req: FastifyRequest, reply: FastifyReply, code: number, key: string) =>
	fail(reply, code, await translateContext(req.guild, key));

/** Same rule as the now playing buttons: only from the bot's voice channel */
const getControllablePlayer = async (req: FastifyRequest, reply: FastifyReply) => {
	const player = useClient().lavalink.getPlayer(req.guild.id);
	if (!player?.queue.current) return void (await failWith(req, reply, 400, "music/play:NOT_PLAYING"));

	const channelId = req.guild.voiceStates.cache.get(req.session.user!.id)?.channelId;
	if (!channelId) return void (await failWith(req, reply, 403, "music/play:NO_VOICE_CHANNEL"));
	if (channelId !== player.voiceChannelId)
		return void (await failWith(req, reply, 403, "music/play:NOT_SAME_CHANNEL"));

	return player;
};

const done = async (reply: FastifyReply, player: Player, refreshMessage = true) => {
	if (refreshMessage) await updateNowPlaying(player);
	notifyMusicChange(player.guildId);

	return send(reply, { ok: true });
};

export default async function musicRoutes(fastify: FastifyInstance) {
	fastify.get("/music", async (req, reply) => send(reply, getMusicState(req.guild, req.session.user!.id)));

	fastify.get("/music/ws", { websocket: true }, (socket, req) =>
		subscribe(req.guild.id, { socket, userId: req.session.user!.id }),
	);

	fastify.post("/music/action", async (req, reply) => {
		const action = (req.body as { action?: unknown } | undefined)?.action as PlayerAction;
		if (!PLAYER_ACTIONS.includes(action)) return fail(reply, 400, "Unknown action");

		const player = await getControllablePlayer(req, reply);
		if (!player) return;

		const notice = await runPlayerAction(player, action);
		if (notice && notice !== "music/shuffle:SUCCESS") return failWith(req, reply, 400, notice);

		return done(reply, player, !TRACK_CHANGING_ACTIONS.includes(action));
	});

	fastify.post("/music/volume", async (req, reply) => {
		const value = Number((req.body as { value?: unknown } | undefined)?.value);
		if (!Number.isInteger(value) || value < 0 || value > MAX_VOLUME)
			return fail(reply, 400, `Volume must be from 0 to ${MAX_VOLUME}`);

		const player = await getControllablePlayer(req, reply);
		if (!player) return;

		await player.setVolume(value);

		return done(reply, player);
	});

	fastify.post("/music/seek", async (req, reply) => {
		const position = Number((req.body as { position?: unknown } | undefined)?.position);

		const player = await getControllablePlayer(req, reply);
		if (!player) return;

		const { duration, isStream } = player.queue.current!.info;
		if (isStream || !Number.isFinite(position) || position < 0 || position > duration)
			return fail(reply, 400, "Can't seek there");

		await player.seek(Math.round(position));

		return done(reply, player, false);
	});

	fastify.post("/music/remove", async (req, reply) => {
		const index = Number((req.body as { index?: unknown } | undefined)?.index);

		const player = await getControllablePlayer(req, reply);
		if (!player) return;

		if (!Number.isInteger(index) || !player.queue.tracks[index])
			return fail(reply, 400, "No track at this position");

		await player.queue.remove(index);

		return done(reply, player);
	});

	fastify.post("/music/move", async (req, reply) => {
		const { from, to } = (req.body ?? {}) as { from?: unknown; to?: unknown };
		const [fromIndex, toIndex] = [Number(from), Number(to)];

		const player = await getControllablePlayer(req, reply);
		if (!player) return;

		const { length } = player.queue.tracks;
		if (![fromIndex, toIndex].every(i => Number.isInteger(i) && i >= 0 && i < length))
			return fail(reply, 400, "No track at this position");

		const [track] = await player.queue.splice(fromIndex, 1);
		await player.queue.splice(toIndex, 0, track);

		return done(reply, player);
	});

	fastify.post("/music/clear", async (req, reply) => {
		const player = await getControllablePlayer(req, reply);
		if (!player) return;

		await player.queue.splice(0, player.queue.tracks.length);

		return done(reply, player);
	});

	fastify.post("/music/play", async (req, reply) => {
		const body = (req.body ?? {}) as { query?: unknown; source?: unknown; next?: unknown };
		const query = typeof body.query === "string" ? body.query.trim() : "";
		if (!query || query.length > MAX_QUERY) return fail(reply, 400, "Enter a link or a search query");

		const source =
			typeof body.source === "string" && body.source in SEARCH_SOURCES
				? (body.source as SearchSource)
				: undefined;
		const member = await req.guild.members.fetch(req.session.user!.id).catch(() => null);
		if (!member) return failWith(req, reply, 403, "music/play:NO_VOICE_CHANNEL");

		const current = useClient().lavalink.getPlayer(req.guild.id);
		const voiceError = checkVoice(member, current?.queue.current ? current : undefined);
		if (voiceError) return failWith(req, reply, 403, voiceError);

		// A voice channel has its own text chat, so the now playing message lands next to the listeners
		const { res, error } = await addToQueue({
			guildId: req.guild.id,
			textChannelId: current?.textChannelId ?? member.voice.channelId!,
			voiceChannelId: member.voice.channelId!,
			requester: member.user,
			query,
			source,
			next: body.next === true,
		});

		if (!res) return failWith(req, reply, 400, error);

		notifyMusicChange(req.guild.id);

		return send(reply, {
			added: res.loadType === "playlist" ? res.tracks.length : 1,
			title: res.loadType === "playlist" ? (res.playlist?.title ?? null) : res.tracks[0].info.title,
		});
	});
}
