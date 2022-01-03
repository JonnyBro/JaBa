const Canvas = require("canvas"),
	Discord = require("discord.js"),
	stringCleaner = require("@sindresorhus/slugify"),
	{ resolve } = require("path");

// Register assets fonts
Canvas.registerFont(resolve("./assets/fonts/RubikMonoOne-Regular.ttf"), { family: "RubikMonoOne" });
Canvas.registerFont(resolve("./assets/fonts/KeepCalm-Medium.ttf"), { family: "KeepCalm" });

const applyText = (canvas, text, defaultFontSize) => {
	const ctx = canvas.getContext("2d");
	do {
		ctx.font = `${defaultFontSize -= 10}px RubikMonoOne`;
	} while (ctx.measureText(text).width > 600);
	return ctx.font;
};

module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run(member) {
		await member.guild.members.fetch();

		const guildData = await this.client.findOrCreateGuild({
			id: member.guild.id
		});
		member.guild.data = guildData;

		const memberData = await this.client.findOrCreateMember({
			id: member.id,
			guildID: member.guild.id
		});
		if (memberData.mute.muted && memberData.mute.endDate > Date.now()) {
			member.guild.channels.cache.forEach((channel) => {
				channel.updateOverwrite(member.id, {
					SEND_MESSAGES: false,
					ADD_REACTIONS: false,
					CONNECT: false
				}).catch(() => {});
			});
		};

		// Check if the autorole is enabled
		if (guildData.plugins.autorole.enabled) member.roles.add(guildData.plugins.autorole.role).catch(() => {});

		// Check if welcome message is enabled
		if (guildData.plugins.welcome.enabled) {
			const channel = member.guild.channels.cache.get(guildData.plugins.welcome.channel);
			if (channel) {
				const message = guildData.plugins.welcome.message
					.replace(/{user}/g, member)
					.replace(/{server}/g, member.guild.name)
					.replace(/{membercount}/g, member.guild.memberCount)
					.replace(/{createdat}/g, this.client.printDate(member.user.createdAt))
				if (guildData.plugins.welcome.withImage) {
					const canvas = Canvas.createCanvas(1024, 450),
						ctx = canvas.getContext("2d");

					// Background image
					const background = await Canvas.loadImage("./assets/img/greetings_background.png");

					// This uses the canvas dimensions to stretch the image onto the entire canvas
					ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

					// Draw username
					ctx.fillStyle = "#ffffff";
					const username = stringCleaner(member.user.username, {
						separator: " ",
						lowercase: false,
						decamelize: false,
						preserveLeadingUnderscore: true,
					});
					ctx.font = applyText(canvas, username, 50);
					ctx.fillText(username, canvas.width - 660, canvas.height - 250);

					// Draw server name
					ctx.font = applyText(canvas, member.guild.translate("administration/welcome:IMG_WELCOME", {
						server: member.guild.name
					}), 53);
					ctx.fillText(member.guild.translate("administration/welcome:IMG_WELCOME", {
						server: member.guild.name
					}), canvas.width - 690, canvas.height - 85);

					// Draw discriminator
					ctx.font = "35px RubikMonoOne";
					ctx.fillText(member.user.discriminator, canvas.width - 624, canvas.height - 180);

					// Draw number
					ctx.font = "22px RubikMonoOne";
					ctx.fillText(member.guild.translate("administration/welcome:IMG_NB", {
						memberCount: member.guild.memberCount
					}), 50, canvas.height - 50);

					// Draw # for discriminator
					ctx.fillStyle = "#44d14a";
					ctx.font = "70px RubikMonoOne";
					ctx.fillText("#", canvas.width - 690, canvas.height - 165);

					// Draw Title with gradient
					ctx.font = "65px RubikMonoOne";
					ctx.strokeStyle = "#1d2124";
					ctx.lineWidth = 15;
					ctx.strokeText(member.guild.translate("administration/welcome:TITLE"), canvas.width - 670, canvas.height - 330);

					var gradient = ctx.createLinearGradient(canvas.width - 780, 0, canvas.width - 30, 0);
					gradient.addColorStop(0, "#e15500");
					gradient.addColorStop(1, "#e7b121");
					ctx.fillStyle = gradient;
					ctx.fillText(member.guild.translate("administration/welcome:TITLE"), canvas.width - 670, canvas.height - 330);

					// Pick up the pen
					ctx.beginPath();

					//Define Stroke Line
					ctx.lineWidth = 10;

					//Define Stroke Style
					ctx.strokeStyle = "#03A9F4";

					// Start the arc to form a circle
					ctx.arc(180, 225, 135, 0, Math.PI * 2, true);

					// Draw Stroke
					ctx.stroke();

					// Put the pen down
					ctx.closePath();

					// Clip off the region you drew on
					ctx.clip();

					const options = {
							format: "png",
							size: 512
						},
						avatar = await Canvas.loadImage(member.user.displayAvatarURL(options));

					// Move the image downwards vertically and constrain its height to 200, so it"s a square
					ctx.drawImage(avatar, 45, 90, 270, 270);

					const attachment = new Discord.MessageAttachment(canvas.toBuffer(), "welcome-image.png");
					channel.send(message, attachment);
				} else {
					channel.send(message);
				};
			};
		};
	}
};