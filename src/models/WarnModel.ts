import { model, Schema, Types } from "mongoose";

export interface IWarnSchema {
	_id: Types.ObjectId;
	guildId: string;
	userId: string;
	moderatorId: string;
	reason: string | null;
	removedBy: string | null;
	removedAt: Date | null;
	createdAt: Date;
}

const warnSchema = new Schema<IWarnSchema>(
	{
		guildId: { type: String, required: true },
		userId: { type: String, required: true },
		moderatorId: { type: String, required: true },
		reason: { type: String, default: null },
		removedBy: { type: String, default: null },
		removedAt: { type: Date, default: null },
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

warnSchema.index({ guildId: 1, userId: 1, createdAt: -1 });
warnSchema.index({ guildId: 1, createdAt: -1 });

export default model<IWarnSchema>("Warn", warnSchema);
