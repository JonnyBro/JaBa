import { model, Schema } from "mongoose";

export type BlacklistType = "user" | "guild";

export interface IBlacklistSchema {
	type: BlacklistType;
	id: string;
	reason: string | null;
	createdAt: Date;
}

const blacklistSchema = new Schema<IBlacklistSchema>(
	{
		type: { type: String, enum: ["user", "guild"], required: true },
		id: { type: String, required: true },
		reason: { type: String, default: null },
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

blacklistSchema.index({ type: 1, id: 1 }, { unique: true });

export default model<IBlacklistSchema>("Blacklist", blacklistSchema);
