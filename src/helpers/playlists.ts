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

export const toPlaylistTrack = (track: Track): PlaylistTrack => ({
	encoded: track.encoded!,
	info: track.info,
	pluginInfo: track.pluginInfo,
});

export const playlistNameTaken = async (userId: string, name: string, exceptId?: string) =>
	(await PlaylistModel.find({ userId }, { name: 1 }).lean()).some(
		p => p._id.toString() !== exceptId && p.name.toLowerCase() === name.toLowerCase(),
	);

/** Returns an error message for the dashboard instead of the playlist when it can't be created */
export const createPlaylist = async (userId: string, rawName: unknown) => {
	const name = normalizePlaylistName(rawName);
	if (!name) return { playlist: null, error: `The name must be 1-${MAX_PLAYLIST_NAME} characters` };

	if ((await PlaylistModel.countDocuments({ userId })) >= MAX_PLAYLISTS)
		return { playlist: null, error: `You can have up to ${MAX_PLAYLISTS} playlists` };
	if (await playlistNameTaken(userId, name))
		return { playlist: null, error: "You already have a playlist with this name" };

	return { playlist: await PlaylistModel.create({ userId, name }), error: null };
};

/** Adds what fits into the playlist, unresolved tracks have nothing to save and are skipped */
export const appendTracks = async (
	playlist: InstanceType<typeof PlaylistModel>,
	tracks: (Track | UnresolvedTrack)[],
) => {
	const saved = tracks
		.filter((t): t is Track => !!t.encoded)
		.slice(0, MAX_PLAYLIST_TRACKS - playlist.tracks.length)
		.map(toPlaylistTrack);

	playlist.tracks = [...playlist.tracks, ...saved];
	playlist.markModified("tracks");
	await playlist.save();

	return { added: saved.length, skipped: tracks.length - saved.length };
};

/** Autocomplete gives the id, but a name typed by hand works too */
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

export const playPlaylist = ({ playlist, shuffle, ...options }: PlayPlaylistOptions) => {
	const tracks = playlist.tracks.map(track => useClient().lavalink.utils.buildTrack(track, options.requester));

	if (shuffle)
		for (let i = tracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[tracks[i], tracks[j]] = [tracks[j], tracks[i]];
		}

	return addTracks({ ...options, tracks });
};
