import { Schema, model } from "mongoose";
import { createCanvas, loadImage } from "@napi-rs/canvas";

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

interface IUserSchema {
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
			default: {
				message: null,
				createdAt: null,
				sendAt: null,
			},
		},
	],
});

userSchema.method("getAchievementsImage", async function () {
	const canvas = createCanvas(1800, 250),
		ctx = canvas.getContext("2d");

	const images = [
		await loadImage(
			`./assets/img/achievements/achievement${
				this.achievements.work.achieved ? "_colored" : ""
			}1.png`,
		),
		await loadImage(
			`./assets/img/achievements/achievement${
				this.achievements.firstCommand.achieved ? "_colored" : ""
			}2.png`,
		),
		await loadImage(
			`./assets/img/achievements/achievement${
				this.achievements.married.achieved ? "_colored" : ""
			}3.png`,
		),
		await loadImage(
			`./assets/img/achievements/achievement${
				this.achievements.slots.achieved ? "_colored" : ""
			}4.png`,
		),
		await loadImage(
			`./assets/img/achievements/achievement${
				this.achievements.tip.achieved ? "_colored" : ""
			}5.png`,
		),
		await loadImage(
			`./assets/img/achievements/achievement${
				this.achievements.rep.achieved ? "_colored" : ""
			}6.png`,
		),
		await loadImage(
			`./assets/img/achievements/achievement${
				this.achievements.invite.achieved ? "_colored" : ""
			}7.png`,
		),
	];
	let dim = 0;

	for (let i = 0; i < images.length; i++) {
		ctx.drawImage(images[i], dim, 10, 350, 200);
		dim += 200;
	}

	return await canvas.encode("png");
});

export default model<IUserSchema>("User", userSchema);
