import { Schema, Document, model } from "mongoose";

interface IMemberSchema extends Document {
	id: string;
	guildID: string;
	money: number;
	workStreak: number;
	bankSold: number;
	exp: number;
	level: number;
	transactions: string[];
	registeredAt: number;
	cooldowns: {
		work: number;
		rob: number;
	};
	sanctions: string[];
	mute: {
		muted: boolean;
		case: string | null;
		endDate: number | null;
	};
}

const memberSchema = new Schema<IMemberSchema>({
	id: { type: String },
	guildID: { type: String, ref: "Guild" },

	money: { type: Number, default: 0 },
	workStreak: { type: Number, default: 0 },
	bankSold: { type: Number, default: 0 },
	exp: { type: Number, default: 0 },
	level: { type: Number, default: 0 },
	transactions: [String],

	registeredAt: { type: Number, default: Date.now() },

	cooldowns: {
		type: Object,
		default: {
			work: 0,
			rob: 0,
		},
	},

	sanctions: [String],
	mute: {
		type: Object,
		default: {
			muted: false,
			case: null,
			endDate: null,
		},
	},
});

export default model<IMemberSchema>("Member", memberSchema);
