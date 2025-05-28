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
	workStreak: number;
	bankSold: number;
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
	money: { type: Number, default: 0 },
	workStreak: { type: Number, default: 0 },
	bankSold: { type: Number, default: 0 },
	exp: { type: Number, default: 0 },
	level: { type: Number, default: 0 },
	transactions: { type: [transactionSchema], default: [] },
	registeredAt: { type: Number, default: () => Date.now() },
	cooldowns: { type: cooldownSchema, default: () => ({ work: 0, rob: 0 }) },
});

memberSchema.pre("validate", function (next) {
	const now = Date.now();

	(["money", "workStreak", "bankSold", "exp", "level"] as const).forEach(field => {
		if (typeof this[field] !== "number" || isNaN(this[field]) || this[field] < 0) {
			this[field] = 0;
		}
	});

	if (!Array.isArray(this.transactions)) {
		this.transactions = [];
	} else {
		this.transactions = this.transactions.map(t => ({
			user: typeof t.user === "string" ? t.user : "",
			amount: typeof t.amount === "number" ? t.amount : 0,
			date: typeof t.date === "number" ? t.date : now,
			type: typeof t.type === "string" ? t.type : "unknown",
		}));
	}

	if (typeof this.registeredAt !== "number" || this.registeredAt <= 0) {
		this.registeredAt = now;
	}

	if (!this.cooldowns || typeof this.cooldowns !== "object") {
		this.cooldowns = { work: 0, rob: 0 };
	} else {
		this.cooldowns = {
			work: typeof this.cooldowns.work === "number" ? this.cooldowns.work : 0,
			rob: typeof this.cooldowns.rob === "number" ? this.cooldowns.rob : 0,
		};
	}

	next();
});

export default model<IMemberSchema>("Member", memberSchema);
