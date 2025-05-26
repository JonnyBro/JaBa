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

memberSchema.pre("save", function (next) {
	const now = Date.now();
	const defaults = {
		money: 0,
		workStreak: 0,
		bankSold: 0,
		exp: 0,
		level: 0,
		transactions: [] as Transaction[],
		registeredAt: now,
		cooldowns: {
			work: 0,
			rob: 0,
		},
	};

	(["money", "workStreak", "bankSold", "exp", "level"] as const).forEach(field => {
		if (typeof this[field] !== "number" || isNaN(this[field]) || this[field] < 0) {
			this[field] = defaults[field];
		}
	});

	if (!Array.isArray(this.transactions)) {
		this.transactions = defaults.transactions;
	} else {
		this.transactions = this.transactions.map(t => ({
			user: typeof t.user === "string" ? t.user : "",
			amount: typeof t.amount === "number" ? t.amount : 0,
			date: typeof t.date === "number" ? t.date : now,
			type: typeof t.type === "string" ? t.type : "unknown",
		}));
	}

	if (typeof this.registeredAt !== "number" || this.registeredAt <= 0) {
		this.registeredAt = defaults.registeredAt;
	}

	if (!this.cooldowns || typeof this.cooldowns !== "object") {
		this.cooldowns = { ...defaults.cooldowns };
	} else {
		this.cooldowns = {
			work:
				typeof this.cooldowns.work === "number"
					? this.cooldowns.work
					: defaults.cooldowns.work,
			rob:
				typeof this.cooldowns.rob === "number"
					? this.cooldowns.rob
					: defaults.cooldowns.rob,
		};
	}

	next();
});

export default model<IMemberSchema>("Member", memberSchema);
