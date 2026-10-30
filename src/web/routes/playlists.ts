import {
	AUDIO_EXTENSIONS,
	deleteFile,
	getFileExpiry,
	getFilePath,
	getFilesById,
	getFileUrl,
	getUsedStorage,
	releaseFiles,
	STORAGE_QUOTA,
	UPLOAD_SOURCE,
} from "@/helpers/audio-files.js";
import logger from "@/helpers/logger.js";
import { formatSource, SEARCH_SOURCES, SearchSource, searchTracks } from "@/helpers/music.js";
import { appendTracks, createPlaylist, normalizePlaylistName, playlistNameTaken } from "@/helpers/playlists.js";
import PlaylistModel, {
	IPlaylistSchema,
	MAX_PLAYLIST_NAME,
	MAX_PLAYLIST_TRACKS,
	MAX_PLAYLISTS,
	PlaylistTrack,
} from "@/models/PlaylistModel.js";
import AudioFileModel from "@/models/AudioFileModel.js";
import useClient from "@/utils/use-client.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Track } from "lavalink-client";
import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { pipeline } from "node:stream/promises";
import { fail, requireUser, send } from "../utils.js";

const MAX_QUERY = 500;

const SEARCH_ERRORS: Record<string, string> = {
	"music/play:NODE_UNAVAILABLE": "Music server is unavailable right now, try again later",
	"music/play:NO_RESULT": "Nothing found",
	"music/play:LOAD_FAILED": "Couldn't load this track",
};

type FileStatus = { expired: boolean; expiresAt: Date | null };

const serializeTrack = ({ info }: PlaylistTrack, file: FileStatus | null) => ({
	title: info.title ?? "Unknown",
	author: (info.author ?? "Unknown").replace(/ - Topic$/, ""),
	uri: info.uri ?? null,
	artworkUrl: info.artworkUrl ?? null,
	duration: info.duration ?? 0,
	isStream: !!info.isStream,
	source: info.sourceName ? formatSource(info.sourceName) : null,
	file,
});

const serializeSummary = (playlist: IPlaylistSchema) => ({
	id: playlist._id.toString(),
	name: playlist.name,
	trackCount: playlist.tracks.length,
	duration: playlist.tracks.reduce((sum, t) => sum + (t.info.isStream ? 0 : (t.info.duration ?? 0)), 0),
	artworkUrl: playlist.tracks.find(t => t.info.artworkUrl)?.info.artworkUrl ?? null,
	updatedAt: playlist.updatedAt,
});

const serializePlaylist = async (playlist: IPlaylistSchema) => {
	const files = await getFilesById(playlist.tracks.map(t => t.fileId));

	return {
		...serializeSummary(playlist),
		tracks: playlist.tracks.map(track => {
			if (!track.fileId) return serializeTrack(track, null);

			const file = files.get(track.fileId);
			const expired = !file || !!file.expiredAt;

			return serializeTrack(track, { expired, expiresAt: expired ? null : getFileExpiry(file) });
		}),
	};
};

const isUnknown = (value: string | undefined, placeholder: string) => !value?.trim() || value === placeholder;

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
			storage: { used: await getUsedStorage(req.session.user!.id), max: STORAGE_QUOTA },
			extensions: AUDIO_EXTENSIONS,
			items: playlists.map(serializeSummary),
		});
	});

	fastify.post("/api/users/me/playlists", async (req, reply) => {
		const { playlist, error } = await createPlaylist(
			req.session.user!.id,
			(req.body as { name?: unknown } | undefined)?.name,
		);
		if (!playlist) return fail(reply, 400, error);

		return send(reply, await serializePlaylist(playlist));
	});

	fastify.get("/api/users/me/playlists/:playlistId", async (req, reply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		return send(reply, await serializePlaylist(playlist));
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

		return send(reply, await serializePlaylist(playlist));
	});

	fastify.delete("/api/users/me/playlists/:playlistId", async (req, reply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		await playlist.deleteOne();
		await releaseFiles(
			playlist.userId,
			playlist.tracks.map(t => t.fileId),
		);

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
			playlist: await serializePlaylist(playlist),
		});
	});

	fastify.delete("/api/users/me/playlists/:playlistId/tracks/:index", async (req, reply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		const index = Number((req.params as { index: string }).index);
		if (!Number.isInteger(index) || !playlist.tracks[index]) return fail(reply, 400, "No track at this position");

		const [removed] = playlist.tracks.splice(index, 1);
		playlist.markModified("tracks");
		await playlist.save();
		await releaseFiles(playlist.userId, [removed.fileId]);

		return send(reply, await serializePlaylist(playlist));
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

		return send(reply, await serializePlaylist(playlist));
	});

	const upload = async (req: FastifyRequest, reply: FastifyReply) => {
		const playlist = await getOwnPlaylist(req, reply);
		if (!playlist) return;

		const { index: indexParam } = req.params as { index?: string };
		const index = indexParam === undefined ? null : Number(indexParam);
		const replaced = index === null ? null : playlist.tracks[index];

		if (index !== null && !replaced?.fileId) return fail(reply, 400, "No uploaded file at this position");
		if (index === null && playlist.tracks.length >= MAX_PLAYLIST_TRACKS)
			return fail(reply, 400, `A playlist can have up to ${MAX_PLAYLIST_TRACKS} tracks`);

		const quotaError = `Uploaded files can take up to ${STORAGE_QUOTA / 1024 / 1024} MB in total`;
		const free = STORAGE_QUOTA - (await getUsedStorage(playlist.userId));
		if (free <= 0) return fail(reply, 400, quotaError);

		const data = await req.file({ limits: { fileSize: free } });
		if (!data) return fail(reply, 400, "Choose a file");

		const extension = extname(data.filename).slice(1).toLowerCase();
		if (!AUDIO_EXTENSIONS.includes(extension)) {
			data.file.resume();
			return fail(reply, 400, `Supported formats: ${AUDIO_EXTENSIONS.join(", ")}`);
		}

		const file = new AudioFileModel({
			userId: playlist.userId,
			token: randomBytes(32).toString("hex"),
			name: data.filename.slice(0, 200),
			size: 0,
		});
		const path = await getFilePath(file);

		try {
			await pipeline(data.file, createWriteStream(path));
		} catch (error) {
			await rm(path, { force: true });
			throw error;
		}

		if (data.file.truncated) {
			await rm(path, { force: true });
			return fail(reply, 413, quotaError);
		}

		file.size = (await stat(path)).size;
		await file.save();

		// Lavalink reads the file the same way it will when playing, so a format it can't decode fails here
		const node = useClient().lavalink.nodeManager.leastUsedNodes("playingPlayers")[0];
		const res = node && (await node.search({ query: getFileUrl(file) }, useClient().user).catch(() => null));
		const resolved = res?.tracks[0] as Track | undefined;

		if (!resolved?.encoded) {
			await deleteFile(file);
			if (!node) return fail(reply, 400, SEARCH_ERRORS["music/play:NODE_UNAVAILABLE"]);

			// An unknown format is a "common" error, a "fault" or nothing at all means Lavalink couldn't download it.
			// Lavalink sends the severity in lowercase, unlike the library types say
			if (res?.loadType === "error" && res.exception?.severity.toLowerCase() === "common")
				return fail(reply, 400, `Couldn't read this file: ${res.exception.message}`);

			logger.warn(
				`[Files] Lavalink couldn't download ${getFileUrl(file)}, check DASHBOARD_INTERNAL_URL:`,
				res?.exception?.cause ?? res?.loadType ?? "no response",
			);

			return fail(reply, 500, "The music server couldn't get the file, tell the bot owner");
		}

		const user = req.session.user!;
		const track: PlaylistTrack = {
			encoded: resolved.encoded,
			info: {
				...resolved.info,
				title: isUnknown(resolved.info.title, "Unknown title")
					? basename(data.filename, extname(data.filename))
					: resolved.info.title,
				author: isUnknown(resolved.info.author, "Unknown artist")
					? (user.globalName ?? user.username)
					: resolved.info.author,
				sourceName: UPLOAD_SOURCE as Track["info"]["sourceName"],
				uri: "",
			},
			pluginInfo: resolved.pluginInfo,
			fileId: file._id.toString(),
		};

		if (index === null) playlist.tracks.push(track);
		else playlist.tracks[index] = track;

		playlist.markModified("tracks");
		await playlist.save();

		if (replaced) await releaseFiles(playlist.userId, [replaced.fileId]);

		return send(reply, { title: track.info.title, playlist: await serializePlaylist(playlist) });
	};

	fastify.post("/api/users/me/playlists/:playlistId/upload", upload);
	fastify.post("/api/users/me/playlists/:playlistId/tracks/:index/upload", upload);
}
