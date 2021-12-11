const Canvas = require("canvas"),
	Discord = require("discord.js"),
	stringCleaner = require("@sindresorhus/slugify"),
	{ resolve } = require("path");

// Register assets fonts
Canvas.registerFont(resolve("./assets/fonts/RubikMonoOne-Regular.ttf"), { family: "Regular" });

const applyText = (canvas, text, defaultFontSize) => {
	const ctx = canvas.getContext("2d");
	do {
		ctx.font = `${defaultFontSize -= 10}px Regular`;
	} while (ctx.measureText(text).width > 600);
	return ctx.font;
};

module.exports = class {
	constructor (client) {
		this.client = client;
	}

	async run (member) {
		await member.guild.members.fetch();

		const guildData = await this.client.findOrCreateGuild({ id: member.guild.id });
		member.guild.data = guildData;

		// Check if goodbye message is enabled
		if (guildData.plugins.goodbye.enabled) {
			const channel = member.guild.channels.cache.get(guildData.plugins.goodbye.channel);
			if (channel) {
				const message = guildData.plugins.goodbye.message
					.replace(/{user}/g, member.user.tag)
					.replace(/{server}/g, member.guild.name)
					.replace(/{membercount}/g, member.guild.memberCount)
					.replace(/{createdat}/g, this.client.printDate(member.user.createdAt))
				if (guildData.plugins.goodbye.withImage) {
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
					ctx.font = applyText(canvas, member.guild.translate("administration/goodbye:IMG_GOODBYE", {
						server: member.guild.name
					}), 53);
					ctx.fillText(member.guild.translate("administration/goodbye:IMG_GOODBYE", {
						server: member.guild.name
					}), canvas.width - 690, canvas.height - 65);
					// Draw discriminator
					ctx.font = "35px Regular";
					ctx.fillText(member.user.discriminator, canvas.width - 624, canvas.height - 180);
					// Draw number
					ctx.font = "22px Regular";
					ctx.fillText(member.guild.translate("administration/goodbye:IMG_NB", {
						memberCount: member.guild.memberCount
					}), 50, canvas.height - 50);
					// Draw # for discriminator
					ctx.fillStyle = "#44d14a";
					ctx.font = "70px Regular";
					ctx.fillText("#", canvas.width - 690, canvas.height - 165);
					// Draw Title with gradient
					ctx.font = "65px Regular";
					ctx.strokeStyle = "#1d2124";
					ctx.lineWidth = 15;
					ctx.strokeText(member.guild.translate("administration/goodbye:TITLE"), canvas.width - 670, canvas.height - 330);
					var gradient = ctx.createLinearGradient(canvas.width - 780, 0, canvas.width - 30, 0);
					gradient.addColorStop(0, "#e15500");
					gradient.addColorStop(1, "#e7b121");
					ctx.fillStyle = gradient;
					ctx.fillText(member.guild.translate("administration/goodbye:TITLE"), canvas.width - 670, canvas.height - 330);

					// Pick up the pen
					ctx.beginPath();
					//Define Stroke Line
					ctx.lineWidth = 10;
					//Define Stroke Style
					ctx.strokeStyle = "#df0909";
					// Start the arc to form a circle
					ctx.arc(180, 225, 135, 0, Math.PI * 2, true);
					// Draw Stroke
					ctx.stroke();
					// Put the pen down
					ctx.closePath();
					// Clip off the region you drew on
					ctx.clip();

					const options = { format: "png", size: 512 },
						avatar = await Canvas.loadImage(member.user.displayAvatarURL(options));
						// Move the image downwards vertically and constrain its height to 200, so it"s a square
					ctx.drawImage(avatar, 45, 90, 270, 270);

					const attachment = new Discord.MessageAttachment(canvas.toBuffer(), "goodbye-image.png");
					channel.send(message, attachment);
				} else {
					channel.send(message);
				};
			};
		};
	}
};