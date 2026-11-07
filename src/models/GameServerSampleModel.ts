import { model, Schema, Types } from "mongoose";

export const SAMPLE_TTL_DAYS = 8;

export interface IGameServerSample {
	serverId: Types.ObjectId;
	at: Date;
	/** Null when the server didn't answer */
	players: number | null;
}

const gameServerSampleSchema = new Schema<IGameServerSample>(
	{
		serverId: { type: Schema.Types.ObjectId, required: true },
		at: { type: Date, required: true },
		players: { type: Number, default: null },
	},
	{ versionKey: false },
);

gameServerSampleSchema.index({ serverId: 1, at: 1 });
gameServerSampleSchema.index({ at: 1 }, { expireAfterSeconds: SAMPLE_TTL_DAYS * 24 * 60 * 60 });

export default model<IGameServerSample>("GameServerSample", gameServerSampleSchema);
