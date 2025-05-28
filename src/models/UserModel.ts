import { Schema, model } from "mongoose";

export type UserReminds = {
	message: string;
	createdAt: number;
	sendAt: number;
};

export type Achievement = {
	achieved: boolean;
	progress: {
		now: number;
		total: number;
	};
};

export interface IUserSchema {
	id: string;
	rep: number;
	bio: string | null;
	birthdate: number | null;
	lover: string | null;
	registeredAt: number;
	achievements: Record<string, Achievement>;
	cooldowns: {
		rep: number;
	};
	reminds: UserReminds[];
}

const achievementSchema = new Schema(
	{
		achieved: { type: Boolean, default: false },
		progress: {
			now: { type: Number, default: 0 },
			total: { type: Number, required: true },
		},
	},
	{ _id: false },
);

const remindsSchema = new Schema(
	{
		message: { type: String, required: true },
		createdAt: { type: Number, required: true },
		sendAt: { type: Number, required: true },
	},
	{ _id: false },
);

const userSchema = new Schema<IUserSchema>({
	id: { type: String, required: true },
	rep: { type: Number, default: 0 },
	bio: { type: String, default: null },
	birthdate: { type: Number, default: null },
	lover: { type: String, default: null },
	registeredAt: { type: Number, default: () => Date.now() },
	achievements: {
		type: Map,
		of: achievementSchema,
		default: {},
	},
	cooldowns: {
		rep: { type: Number, default: 0 },
	},
	reminds: {
		type: [remindsSchema],
		default: [],
	},
});

userSchema.pre("validate", function (next) {
	if (!this.isNew) return next();

	const now = Date.now();

	const defaultAchievements: Record<string, Achievement> = {
		married: { achieved: false, progress: { now: 0, total: 1 } },
		work: { achieved: false, progress: { now: 0, total: 10 } },
		firstCommand: { achieved: false, progress: { now: 0, total: 1 } },
		slots: { achieved: false, progress: { now: 0, total: 3 } },
		tip: { achieved: false, progress: { now: 0, total: 1 } },
		rep: { achieved: false, progress: { now: 0, total: 20 } },
		invite: { achieved: false, progress: { now: 0, total: 1 } },
	};

	this.achievements ??= {};

	for (const [key, value] of Object.entries(defaultAchievements)) {
		if (!this.achievements[key]) {
			this.achievements[key] = value;
		}
	}

	if (!Array.isArray(this.reminds)) {
		this.reminds = [];
	} else {
		this.reminds = this.reminds.map(remind => ({
			message: typeof remind.message === "string" ? remind.message : "",
			createdAt: typeof remind.createdAt === "number" ? remind.createdAt : now,
			sendAt: typeof remind.sendAt === "number" ? remind.sendAt : now,
		}));
	}

	this.rep = typeof this.rep === "number" ? this.rep : 0;
	this.bio = typeof this.bio === "string" ? this.bio : null;
	this.lover = typeof this.lover === "string" ? this.lover : null;
	this.registeredAt = typeof this.registeredAt === "number" ? this.registeredAt : now;

	if (!this.cooldowns || typeof this.cooldowns !== "object") {
		this.cooldowns = { rep: 0 };
	} else if (typeof this.cooldowns.rep !== "number") {
		this.cooldowns.rep = 0;
	}

	next();
});

export default model<IUserSchema>("User", userSchema);
