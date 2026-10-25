import { PluginInfo, TrackInfo } from "lavalink-client";
import { model, Schema, Types } from "mongoose";

export const MAX_PLAYLISTS = 10;
export const MAX_PLAYLIST_TRACKS = 200;
export const MAX_PLAYLIST_NAME = 50;

export type PlaylistTrack = {
	encoded: string;
	info: TrackInfo;
	pluginInfo: Partial<PluginInfo>;
};

export interface IPlaylistSchema {
	_id: Types.ObjectId;
	userId: string;
	name: string;
	tracks: PlaylistTrack[];
	createdAt: Date;
	updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylistSchema>(
	{
		userId: { type: String, required: true, index: true },
		name: { type: String, required: true },
		tracks: { type: Schema.Types.Mixed, default: () => [] },
	},
	{ timestamps: true },
);

export default model<IPlaylistSchema>("Playlist", playlistSchema);
