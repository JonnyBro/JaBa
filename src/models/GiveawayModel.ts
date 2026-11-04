import { model, Schema, Types } from "mongoose";

export interface IGiveawaySchema {
	_id: Types.ObjectId;
	guildId: string;
	channelId: string;
	messageId: string | null;
	hostId: string;
	prize: string;
	winners: number;
	credits: number;
	itemId: Types.ObjectId | null;
	requiredLevel: number;
	requiredRoleId: string | null;
	participants: string[];
	winnerIds: string[];
	endsAt: Date;
	ended: boolean;
	createdAt: Date;
}

const giveawaySchema = new Schema<IGiveawaySchema>(
	{
		guildId: { type: String, required: true },
		channelId: { type: String, required: true },
		messageId: { type: String, default: null },
		hostId: { type: String, required: true },
		prize: { type: String, required: true },
		winners: { type: Number, required: true, min: 1 },
		credits: { type: Number, default: 0, min: 0 },
		itemId: { type: Schema.Types.ObjectId, default: null, ref: "ShopItem" },
		requiredLevel: { type: Number, default: 0, min: 0 },
		requiredRoleId: { type: String, default: null },
		participants: { type: [String], default: [] },
		winnerIds: { type: [String], default: [] },
		endsAt: { type: Date, required: true },
		ended: { type: Boolean, default: false },
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

giveawaySchema.index({ ended: 1, endsAt: 1 });
giveawaySchema.index({ guildId: 1, createdAt: -1 });

export default model<IGiveawaySchema>("Giveaway", giveawaySchema);
