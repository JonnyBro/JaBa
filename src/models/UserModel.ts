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

const userSchema = new Schema<IUserSchema>({
	id: { type: String, required: true },

	rep: { type: Number, default: 0 },
	bio: { type: String },
	birthdate: { type: Number },
	lover: { type: String },

	registeredAt: { type: Number, default: Date.now() },

	achievements: {
		type: Object,
		default: {
			married: {
				achieved: false,
				progress: {
					now: 0,
					total: 1,
				},
			},
			work: {
				achieved: false,
				progress: {
					now: 0,
					total: 10,
				},
			},
			firstCommand: {
				achieved: false,
				progress: {
					now: 0,
					total: 1,
				},
			},
			slots: {
				achieved: false,
				progress: {
					now: 0,
					total: 3,
				},
			},
			tip: {
				achieved: false,
				progress: {
					now: 0,
					total: 1,
				},
			},
			rep: {
				achieved: false,
				progress: {
					now: 0,
					total: 20,
				},
			},
			invite: {
				achieved: false,
				progress: {
					now: 0,
					total: 1,
				},
			},
		},
	},

	cooldowns: {
		type: Object,
		default: {
			rep: 0,
		},
	},

	reminds: [
		{
			type: Object,
			default: [],
		},
	],
});

userSchema.pre("save", function (next) {
	const now = Date.now();

	if (!this.registeredAt) {
		this.registeredAt = now;
	}

	if (typeof this.rep !== "number") {
		this.rep = 0;
	}

	if (typeof this.bio !== "string") {
		this.bio = "";
	}

	if (typeof this.lover !== "string") {
		this.lover = "";
	}

	if (!this.achievements || typeof this.achievements !== "object") {
		this.achievements = {
			married: {
				achieved: false,
				progress: { now: 0, total: 1 },
			},
			work: {
				achieved: false,
				progress: { now: 0, total: 10 },
			},
			firstCommand: {
				achieved: false,
				progress: { now: 0, total: 1 },
			},
			slots: {
				achieved: false,
				progress: { now: 0, total: 3 },
			},
			tip: {
				achieved: false,
				progress: { now: 0, total: 1 },
			},
			rep: {
				achieved: false,
				progress: { now: 0, total: 20 },
			},
			invite: {
				achieved: false,
				progress: { now: 0, total: 1 },
			},
		};
	} else {
		const defaultAchievements = {
			married: { achieved: false, progress: { now: 0, total: 1 } },
			work: { achieved: false, progress: { now: 0, total: 10 } },
			firstCommand: { achieved: false, progress: { now: 0, total: 1 } },
			slots: { achieved: false, progress: { now: 0, total: 3 } },
			tip: { achieved: false, progress: { now: 0, total: 1 } },
			rep: { achieved: false, progress: { now: 0, total: 20 } },
			invite: { achieved: false, progress: { now: 0, total: 1 } },
		};

		for (const [key, value] of Object.entries(defaultAchievements)) {
			if (!this.achievements[key]) {
				this.achievements[key] = value;
			}
		}
	}

	if (!this.cooldowns || typeof this.cooldowns !== "object") {
		this.cooldowns = { rep: 0 };
	} else if (typeof this.cooldowns.rep !== "number") {
		this.cooldowns.rep = 0;
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

	next();
});

export default model<IUserSchema>("User", userSchema);
