import { formatSource, SEARCH_SOURCES, SearchSource, searchTracks } from "@/helpers/music.js";
import { appendTracks, createPlaylist, normalizePlaylistName, playlistNameTaken } from "@/helpers/playlists.js";
import PlaylistModel, {
	IPlaylistSchema,
	MAX_PLAYLIST_NAME,
	MAX_PLAYLIST_TRACKS,
	MAX_PLAYLISTS,
	PlaylistTrack,
} from "@/models/PlaylistModel.js";
import useClient from "@/utils/use-client.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fail, requireUser, send } from "../utils.js";

const MAX_QUERY = 500;

const SEARCH_ERRORS: Record<string, string> = {
	"music/play:NODE_UNAVAILABLE": "Music server is unavailable right now, try again later",
	"music/play:NO_RESULT": "Nothing found",
	"music/play:LOAD_FAILED": "Couldn't load this track",
};

const serializeTrack = ({ info }: PlaylistTrack) => ({
	title: info.title ?? "Unknown",
	author: (info.author ?? "Unknown").replace(/ - Topic$/, ""),
	uri: info.uri ?? null,
	artworkUrl: info.artworkUrl ?? null,
	duration: info.duration ?? 0,
	isStream: !!info.isStream,
	source: info.sourceName ? formatSource(info.sourceName) : null,
});

const serializeSummary = (playlist: IPlaylistSchema) => ({
	id: playlist._id.toString(),
	name: playlist.name,
	trackCount: playlist.tracks.length,
	duration: playlist.tracks.reduce((sum, t) => sum + (t.info.isStream ? 0 : (t.info.duration ?? 0)), 0),
	artworkUrl: playlist.tracks.find(t => t.info.artworkUrl)?.info.artworkUrl ?? null,
	updatedAt: playlist.updatedAt,
});

const serializePlaylist = (playlist: IPlaylistSchema) => ({
	...serializeSummary(playlist),
	tracks: playlist.tracks.map(serializeTrack),
});

const getOwnPlaylist = async (req: FastifyRequest, reply: FastifyReply) => {
	const { playlistId } = req.params as { playlistId: string };
	const playlist = /^[a-f\d]{24}$/i.test(playlistId)
		? await PlaylistModel.findOne({ _id: playlistId, userId: req.session.user!.id })
		: null;

	if (!playlist) return void fail(reply, 404, "Playlist not found");

	return playlist;
};

export default async function playlistsRoutes(fastify: FastifyInstance) {
	fastify.addHook("preHandler", requireUser);

	fastify.get("/api/users/me/playlists", async (req, reply) => {
		const playlists = await PlaylistModel.find({ userId: req.session.user!.id }).sort({ createdAt: 1 }).lean();

		return send(reply, {
			max: MAX_PLAYLISTS,
			maxTracks: MAX_PLAYLIST_TRACKS,
			items: playlists.map(serializeSummary),
		});
	});

	fastify.post("/api/users/me/playlists", async (req, reply) => {
		const { playlist, error } = await createPlaylist(
			req.session.user!.id,
			(req.body as { name?: unknown } | undefined)?.name,
		);
		if (!playlist) return fail(reply, 400, error);

		return send(reply, serializePlaylist(playlist));
	});

	fastify.get("/api/users/me/playlists/:playlistId", async (req, reply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		return send(reply, serializePlaylist(playlist));
	});

	fastify.patch("/api/users/me/playlists/:playlistId", async (req, reply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		const name = normalizePlaylistName((req.body as { name?: unknown } | undefined)?.name);
		if (!name) return fail(reply, 400, `The name must be 1-${MAX_PLAYLIST_NAME} characters`);
		if (await playlistNameTaken(playlist.userId, name, playlist._id.toString()))
			return fail(reply, 400, "You already have a playlist with this name");

		playlist.name = name;
		await playlist.save();

		return send(reply, serializePlaylist(playlist));
	});

	fastify.delete("/api/users/me/playlists/:playlistId", async (req, reply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		await playlist.deleteOne();

		return send(reply, { ok: true });
	});

	fastify.post("/api/users/me/playlists/:playlistId/tracks", async (req, reply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		const body = (req.body ?? {}) as { query?: unknown; source?: unknown };
		const query = typeof body.query === "string" ? body.query.trim() : "";
		if (!query || query.length > MAX_QUERY) return fail(reply, 400, "Enter a link or a search query");

		const free = MAX_PLAYLIST_TRACKS - playlist.tracks.length;
		if (free <= 0) return fail(reply, 400, `A playlist can have up to ${MAX_PLAYLIST_TRACKS} tracks`);

		const source =
			typeof body.source === "string" && body.source in SEARCH_SOURCES
				? (body.source as SearchSource)
				: undefined;
		const client = useClient();
		const { res, error } = await searchTracks(query, client.user, source).catch(() => ({
			res: null,
			error: "music/play:LOAD_FAILED",
		}));

		if (!res) return fail(reply, 400, SEARCH_ERRORS[error] ?? SEARCH_ERRORS["music/play:LOAD_FAILED"]);

		const found = res.loadType === "playlist" ? res.tracks : [res.tracks[0]];
		const { added, skipped } = await appendTracks(playlist, found);

		return send(reply, {
			added,
			skipped,
			title: res.loadType === "playlist" ? (res.playlist?.title ?? null) : found[0].info.title,
			playlist: serializePlaylist(playlist),
		});
	});

	fastify.delete("/api/users/me/playlists/:playlistId/tracks/:index", async (req, reply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		const index = Number((req.params as { index: string }).index);
		if (!Number.isInteger(index) || !playlist.tracks[index]) return fail(reply, 400, "No track at this position");

		playlist.tracks = playlist.tracks.filter((_, i) => i !== index);
		playlist.markModified("tracks");
		await playlist.save();

		return send(reply, serializePlaylist(playlist));
	});

	fastify.post("/api/users/me/playlists/:playlistId/move", async (req, reply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		const { from, to } = (req.body ?? {}) as { from?: unknown; to?: unknown };
		const [fromIndex, toIndex] = [Number(from), Number(to)];
		const { length } = playlist.tracks;
		if (![fromIndex, toIndex].every(i => Number.isInteger(i) && i >= 0 && i < length))
			return fail(reply, 400, "No track at this position");

		const tracks = [...playlist.tracks];
		const [track] = tracks.splice(fromIndex, 1);
		tracks.splice(toIndex, 0, track);

		playlist.tracks = tracks;
		playlist.markModified("tracks");
		await playlist.save();

		return send(reply, serializePlaylist(playlist));
	});
}
