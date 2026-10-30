import { model, Schema, Types } from "mongoose";

export interface IAudioFileSchema {
	_id: Types.ObjectId;
	userId: string;
	token: string;
	name: string;
	size: number;
	lastPlayedAt: Date;
	/** The file is deleted from the disk, but the playlist track still points here until it's uploaded again */
	expiredAt: Date | null;
	createdAt: Date;
}

const audioFileSchema = new Schema<IAudioFileSchema>(
	{
		userId: { type: String, required: true, index: true },
		token: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		size: { type: Number, required: true },
		lastPlayedAt: { type: Date, default: () => new Date() },
		expiredAt: { type: Date, default: null },
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

export default model<IAudioFileSchema>("AudioFile", audioFileSchema);
