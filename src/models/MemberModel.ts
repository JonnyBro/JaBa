import { Schema, model } from "mongoose";

export interface Transaction {
	user: string;
	amount: number;
	date: number;
	type: string;
}

const transactionSchema = new Schema<Transaction>(
	{
		user: { type: String, required: true },
		amount: { type: Number, required: true },
		date: { type: Number, required: true },
		type: { type: String, required: true },
	},
	{ _id: false },
);

export interface IMemberSchema {
	id: string;
	guildID: string;
	money: number;
	bank: number;
	exp: number;
	level: number;
	transactions: Transaction[];
	registeredAt: number;
	cooldowns: {
		work: number;
		rob: number;
	};
}

const cooldownSchema = new Schema(
	{
		work: { type: Number, default: 0 },
		rob: { type: Number, default: 0 },
	},
	{ _id: false },
);

const memberSchema = new Schema<IMemberSchema>({
	id: { type: String, required: true },
	guildID: { type: String, required: true, ref: "Guild" },
	money: { type: Number, default: 0, min: 0 },
	bank: { type: Number, default: 0, min: 0 },
	exp: { type: Number, default: 0, min: 0 },
	level: { type: Number, default: 0, min: 0 },
	transactions: { type: [transactionSchema], default: [] },
	registeredAt: { type: Number, default: () => Date.now() },
	cooldowns: { type: cooldownSchema, default: () => ({ work: 0, rob: 0 }) },
});

export default model<IMemberSchema>("Member", memberSchema);
