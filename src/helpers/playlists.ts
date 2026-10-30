import { getFilesById, resolveFileTrack } from "@/helpers/audio-files.js";
import { addTracks } from "@/helpers/music.js";
import PlaylistModel, {
	IPlaylistSchema,
	MAX_PLAYLIST_NAME,
	MAX_PLAYLIST_TRACKS,
	MAX_PLAYLISTS,
	PlaylistTrack,
} from "@/models/PlaylistModel.js";
import useClient from "@/utils/use-client.js";
import { User } from "discord.js";
import { Track, UnresolvedTrack } from "lavalink-client";

export const normalizePlaylistName = (name: unknown) =>
	typeof name === "string" ? name.trim().replace(/\s+/g, " ").slice(0, MAX_PLAYLIST_NAME) : "";

export const toPlaylistTrack = (track: Track, fileId?: string): PlaylistTrack => ({
	encoded: track.encoded!,
	info: track.info,
	pluginInfo: track.pluginInfo,
	...(fileId && { fileId }),
});

const getTrackFileId = (track: Track | UnresolvedTrack) => {
	const fileId = (track.userData as { fileId?: unknown } | undefined)?.fileId;

	return typeof fileId === "string" ? fileId : undefined;
};

export const playlistNameTaken = async (userId: string, name: string, exceptId?: string) =>
	(await PlaylistModel.find({ userId }, { name: 1 }).lean()).some(
		p => p._id.toString() !== exceptId && p.name.toLowerCase() === name.toLowerCase(),
	);

export const createPlaylist = async (userId: string, rawName: unknown) => {
	const name = normalizePlaylistName(rawName);
	if (!name) return { playlist: null, error: `The name must be 1-${MAX_PLAYLIST_NAME} characters` };

	if ((await PlaylistModel.countDocuments({ userId })) >= MAX_PLAYLISTS)
		return { playlist: null, error: `You can have up to ${MAX_PLAYLISTS} playlists` };
	if (await playlistNameTaken(userId, name))
		return { playlist: null, error: "You already have a playlist with this name" };

	return { playlist: await PlaylistModel.create({ userId, name }), error: null };
};

export const appendTracks = async (
	playlist: InstanceType<typeof PlaylistModel>,
	tracks: (Track | UnresolvedTrack)[],
) => {
	// Uploaded files of other people can't be copied, they'd count towards someone else's storage
	const files = await getFilesById(tracks.map(getTrackFileId));
	const saved = tracks
		.filter((t): t is Track => {
			if (!t.encoded) return false;

			const fileId = getTrackFileId(t);
			const file = fileId && files.get(fileId);

			return !fileId || (!!file && file.userId === playlist.userId && !file.expiredAt);
		})
		.slice(0, MAX_PLAYLIST_TRACKS - playlist.tracks.length)
		.map(t => toPlaylistTrack(t, getTrackFileId(t)));

	playlist.tracks = [...playlist.tracks, ...saved];
	playlist.markModified("tracks");
	await playlist.save();

	return { added: saved.length, skipped: tracks.length - saved.length };
};

export const findPlaylist = async (userId: string, idOrName: string) => {
	if (/^[a-f\d]{24}$/i.test(idOrName)) {
		const playlist = await PlaylistModel.findOne({ _id: idOrName, userId });
		if (playlist) return playlist;
	}

	const name = normalizePlaylistName(idOrName).toLowerCase();

	return (await PlaylistModel.find({ userId })).find(p => p.name.toLowerCase() === name) ?? null;
};

type PlayPlaylistOptions = {
	playlist: Pick<IPlaylistSchema, "tracks">;
	guildId: string;
	textChannelId: string;
	voiceChannelId: string;
	requester: User;
	shuffle?: boolean;
};

export const playPlaylist = async ({ playlist, shuffle, ...options }: PlayPlaylistOptions) => {
	const client = useClient();
	const files = await getFilesById(playlist.tracks.map(t => t.fileId));

	const tracks = (
		await Promise.all(
			playlist.tracks.map(track => {
				if (!track.fileId) return client.lavalink.utils.buildTrack(track, options.requester);

				const file = files.get(track.fileId);
				return file && !file.expiredAt ? resolveFileTrack(track, file, options.requester) : null;
			}),
		)
	).filter(track => track !== null);

	const unavailable = playlist.tracks.length - tracks.length;
	if (!tracks.length)
		return { error: unavailable ? "music/playlist:FILES_EXPIRED" : "music/playlist:EMPTY", added: 0, unavailable };

	if (shuffle)
		for (let i = tracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[tracks[i], tracks[j]] = [tracks[j], tracks[i]];
		}

	return { error: await addTracks({ ...options, tracks }), added: tracks.length, unavailable };
};
