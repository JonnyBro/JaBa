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
	bio: string;
	birthdate: number | null;
	lover: string;
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
			default: {},
		},
	],
});

export default model<IUserSchema>("User", userSchema);
