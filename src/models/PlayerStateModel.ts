import { anyObject, PluginInfo, RepeatMode, TrackInfo } from "lavalink-client";
import { model, Schema } from "mongoose";

export type SavedTrack = {
	encoded: string;
	info: TrackInfo;
	pluginInfo: Partial<PluginInfo>;
	userData?: anyObject;
	requesterId?: string;
};

export interface IPlayerStateSchema {
	guildId: string;
	nodeId: string;
	voiceChannelId: string;
	textChannelId: string;
	nowPlayingMessageId: string | null;
	repeatMode: RepeatMode;
	autoplay: boolean;
	currentRequesterId: string | null;
	queue: SavedTrack[];
}

const playerStateSchema = new Schema<IPlayerStateSchema>(
	{
		guildId: { type: String, required: true, unique: true },
		nodeId: { type: String, required: true },
		voiceChannelId: { type: String, required: true },
		textChannelId: { type: String, required: true },
		nowPlayingMessageId: { type: String, default: null },
		repeatMode: { type: String, default: "off" },
		autoplay: { type: Boolean, default: false },
		currentRequesterId: { type: String, default: null },
		queue: { type: Schema.Types.Mixed, default: () => [] },
	},
	{ timestamps: true },
);

export default model<IPlayerStateSchema>("PlayerState", playerStateSchema);
