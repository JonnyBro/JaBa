import { model, Schema, Types } from "mongoose";

export interface IPollSchema {
	_id: Types.ObjectId;
	guildId: string;
	channelId: string;
	messageId: string | null;
	authorId: string;
	question: string;
	options: string[];
	/** User id to the indexes of the chosen options */
	votes: Record<string, number[]>;
	anonymous: boolean;
	multiple: boolean;
	hidden: boolean;
	endsAt: Date;
	ended: boolean;
}

const pollSchema = new Schema<IPollSchema>(
	{
		guildId: { type: String, required: true },
		channelId: { type: String, required: true },
		messageId: { type: String, default: null },
		authorId: { type: String, required: true },
		question: { type: String, required: true },
		options: { type: [String], required: true },
		votes: { type: Schema.Types.Mixed, default: () => ({}) },
		anonymous: { type: Boolean, default: false },
		multiple: { type: Boolean, default: false },
		hidden: { type: Boolean, default: false },
		endsAt: { type: Date, required: true },
		ended: { type: Boolean, default: false },
	},
	{ timestamps: true, minimize: false },
);

pollSchema.index({ ended: 1, endsAt: 1 });

export default model<IPollSchema>("Poll", pollSchema);
