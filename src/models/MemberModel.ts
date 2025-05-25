import { Schema, model } from "mongoose";

export interface Transaction {
	user: string;
	amount: number;
	date: number;
	type: string;
}

export interface IMemberSchema {
	id: string;
	guildID: string;
	money: number;
	workStreak: number;
	bankSold: number;
	exp: number;
	level: number;
	transactions: Array<Transaction>;
	registeredAt: number;
	cooldowns: {
		work: number;
		rob: number;
	};
}

const memberSchema = new Schema<IMemberSchema>({
	id: { type: String, required: true },
	guildID: { type: String, required: true, ref: "Guild" },
	money: { type: Number, default: 0 },
	workStreak: { type: Number, default: 0 },
	bankSold: { type: Number, default: 0 },
	exp: { type: Number, default: 0 },
	level: { type: Number, default: 0 },
	transactions: [],
	registeredAt: { type: Number, default: () => Date.now() },
	cooldowns: {
		type: Object,
		default: {
			work: 0,
			rob: 0,
		},
	},
});

export default model<IMemberSchema>("Member", memberSchema);
