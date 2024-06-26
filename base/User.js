const mongoose = require("mongoose"),
	Canvas = require("@napi-rs/canvas");

const genToken = () => {
	let token = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwzy0123456789.-_";
	for (let i = 0; i < 32; i++) token += characters.charAt(Math.floor(Math.random() * characters.length));

	return token;
};

const userSchema = new mongoose.Schema({
	id: { type: String },

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

	afk: { type: String, default: null },
	reminds: { type: Array, default: [] },
	logged: { type: Boolean, default: false },
	apiToken: { type: String, default: genToken() },
});

userSchema.method("getAchievements", async function () {
	const canvas = Canvas.createCanvas(1800, 250),
		ctx = canvas.getContext("2d");

	const images = [
		await Canvas.loadImage(`./assets/img/achievements/achievement${this.achievements.work.achieved ? "_colored" : ""}1.png`),
		await Canvas.loadImage(`./assets/img/achievements/achievement${this.achievements.firstCommand.achieved ? "_colored" : ""}2.png`),
		await Canvas.loadImage(`./assets/img/achievements/achievement${this.achievements.married.achieved ? "_colored" : ""}3.png`),
		await Canvas.loadImage(`./assets/img/achievements/achievement${this.achievements.slots.achieved ? "_colored" : ""}4.png`),
		await Canvas.loadImage(`./assets/img/achievements/achievement${this.achievements.tip.achieved ? "_colored" : ""}5.png`),
		await Canvas.loadImage(`./assets/img/achievements/achievement${this.achievements.rep.achieved ? "_colored" : ""}6.png`),
		await Canvas.loadImage(`./assets/img/achievements/achievement${this.achievements.invite.achieved ? "_colored" : ""}7.png`),
	];
	let dim = 0;

	for (let i = 0; i < images.length; i++) {
		ctx.drawImage(images[i], dim, 10, 350, 200);
		dim += 200;
	}

	return (await canvas.encode("png"));
});

module.exports = mongoose.model("User", userSchema);
