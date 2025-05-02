/* eslint-disable max-len */
import { Entity, Property } from "@mikro-orm/core";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { ObjectId } from "mongodb";
import { BaseEntity } from "./BaseModel.js";

export type UserReminds = {
	message: string;
	createdAt: number;
	sendAt: number;
};

type UserAchievements = {
	married: {
		achieved: boolean;
		progress: {
			now: number;
			total: number;
		};
	};
	work: {
		achieved: boolean;
		progress: {
			now: number;
			total: number;
		};
	};
	firstCommand: {
		achieved: boolean;
		progress: {
			now: number;
			total: number;
		};
	};
	slots: {
		achieved: boolean;
		progress: {
			now: number;
			total: number;
		};
	};
	tip: {
		achieved: boolean;
		progress: {
			now: number;
			total: number;
		};
	};
	rep: {
		achieved: boolean;
		progress: {
			now: number;
			total: number;
		};
	};
	invite: {
		achieved: boolean;
		progress: {
			now: number;
			total: number;
		};
	};
};

type UserCooldowns = {
	rep: number;
};

const genToken = () => {
	let token = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwzy0123456789.-_";
	for (let i = 0; i < 32; i++) {
		token += characters.charAt(Math.floor(Math.random() * characters.length));
	}

	return token;
};

@Entity({ collection: "users" })
export class User extends BaseEntity {
	@Property({ type: "ObjectId", primary: true })
	_id!: ObjectId;

	@Property({ type: "string", unique: true })
	id!: string;

	@Property({ type: "number", default: 0 })
	rep: number = 0;

	@Property({ type: "string" })
	bio: string = "";

	@Property({ type: "number", default: null })
	birthdate!: number | null;

	@Property({ type: "string" })
	lover: string = "";

	@Property({ type: "number", onCreate: () => Date.now() })
	registeredAt!: number;

	@Property({ type: "json" })
	achievements: UserAchievements = {
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
	};

	@Property({ type: "json" })
	cooldowns: UserCooldowns = {
		rep: 0,
	};

	@Property({ type: "string", default: null })
	afk!: string | null;

	@Property({ type: "array", default: [] })
	reminds: UserReminds[] = [];

	@Property({ type: "boolean" })
	logged: boolean = false;

	@Property({ type: "string", onCreate: () => genToken() })
	token!: string;

	async getAchievements() {
		const canvas = createCanvas(1800, 250),
			ctx = canvas.getContext("2d");

		const images = [
			await loadImage(
				`./assets/img/achievements/achievement${this.achievements.work.achieved ? "_colored" : ""}1.png`,
			),
			await loadImage(
				`./assets/img/achievements/achievement${this.achievements.firstCommand.achieved ? "_colored" : ""}2.png`,
			),
			await loadImage(
				`./assets/img/achievements/achievement${this.achievements.married.achieved ? "_colored" : ""}3.png`,
			),
			await loadImage(
				`./assets/img/achievements/achievement${this.achievements.slots.achieved ? "_colored" : ""}4.png`,
			),
			await loadImage(
				`./assets/img/achievements/achievement${this.achievements.tip.achieved ? "_colored" : ""}5.png`,
			),
			await loadImage(
				`./assets/img/achievements/achievement${this.achievements.rep.achieved ? "_colored" : ""}6.png`,
			),
			await loadImage(
				`./assets/img/achievements/achievement${this.achievements.invite.achieved ? "_colored" : ""}7.png`,
			),
		];
		let dim = 0;

		for (let i = 0; i < images.length; i++) {
			ctx.drawImage(images[i], dim, 10, 350, 200);
			dim += 200;
		}

		const encodedPhoto = await canvas.encode("png");

		return encodedPhoto;
	}
}
