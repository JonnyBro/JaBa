const Canvas = require("canvas"),
	BaseEvent = require("../../base/BaseEvent"),
	{ AttachmentBuilder } = require("discord.js"),
	{ resolve } = require("path");

// Register assets fonts
Canvas.registerFont(resolve("./assets/fonts/RubikMonoOne-Regular.ttf"), { family: "RubikMonoOne" });
Canvas.registerFont(resolve("./assets/fonts/KeepCalm-Medium.ttf"), { family: "KeepCalm" });

const applyText = (canvas, text, defaultFontSize, width, font) => {
	const ctx = canvas.getContext("2d");
	do {
		ctx.font = `${(defaultFontSize -= 1)}px ${font}`;
	} while (ctx.measureText(text).width > width);

	return ctx.font;
};

class GuildMemberAdd extends BaseEvent {
	constructor() {
		super({
			name: "guildMemberAdd",
			once: false
		});
	}

	/**
	 *
	 * @param {import("discord.js").GuildMember} member
	 */
	async execute(member) {
		if (member.guild && member.guild.id === "568120814776614924") return;

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
				channel.permissionOverwrites.edit(member.id, {
					SEND_MESSAGES: false,
					ADD_REACTIONS: false,
					CONNECT: false
				}).catch(() => {});
			});
		}

		// Check if the autorole is enabled
		if (guildData.plugins.autorole.enabled) member.roles.add(guildData.plugins.autorole.role);

		// Check if welcome message is enabled
		if (guildData.plugins.welcome.enabled) {
			const channel = member.guild.channels.cache.get(guildData.plugins.welcome.channel);
			if (channel) {
				const message = guildData.plugins.welcome.message
					.replace(/{user}/g, member)
					.replace(/{server}/g, member.guild.name)
					.replace(/{membercount}/g, member.guild.memberCount)
					.replace(/{createdat}/g, this.client.printDate(member.user.createdAt));
				if (guildData.plugins.welcome.withImage) {
					const canvas = Canvas.createCanvas(1024, 450),
						ctx = canvas.getContext("2d");

					// Draw background
					const background = await Canvas.loadImage("./assets/img/greetings_background.png");
					ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

					// Draw layer
					ctx.fillStyle = "#FFFFFF";
					ctx.globalAlpha = "0.4";
					ctx.fillRect(0, 0, 25, canvas.height);
					ctx.fillRect(canvas.width - 25, 0, 25, canvas.height);
					ctx.fillRect(25, 0, canvas.width - 50, 25);
					ctx.fillRect(25, canvas.height - 25, canvas.width - 50, 25);
					ctx.fillStyle = "#FFFFFF";
					ctx.globalAlpha = "0.4";
					ctx.fillRect(344, canvas.height - 296, 625, 65);
					ctx.fillStyle = "#FFFFFF";
					ctx.globalAlpha = "0.4";
					ctx.fillRect(389, canvas.height - 225, 138, 65);
					ctx.fillStyle = "#FFFFFF";
					ctx.globalAlpha = "0.4";
					ctx.fillRect(308, canvas.height - 110, 672, 65);

					// Draw username
					ctx.globalAlpha = 1;
					ctx.fillStyle = "#FFFFFF";
					ctx.font = applyText(canvas, member.user.username, 48, 600, "RubikMonoOne");
					ctx.fillText(member.user.username, canvas.width - 670, canvas.height - 250);

					// Draw server name
					ctx.font = applyText(canvas, member.guild.translate("administration/welcome:IMG_WELCOME", {
						server: member.guild.name
					}), 53, 625, "RubikMonoOne");

					ctx.fillText(member.guild.translate("administration/welcome:IMG_WELCOME", {
						server: member.guild.name
					}), canvas.width - 700, canvas.height - 70);

					// Draw discriminator
					ctx.font = "35px RubikMonoOne";
					ctx.fillText(member.user.discriminator, canvas.width - 623, canvas.height - 178);

					// Draw membercount
					ctx.font = "22px RubikMonoOne";
					ctx.fillText(`${member.guild.memberCount}й ${member.guild.translate("misc:NOUNS:MEMBERS:1")}`, 40, canvas.height - 35);

					// Draw # for discriminator
					ctx.fillStyle = "#FFFFFF";
					ctx.font = "70px RubikMonoOne";
					ctx.fillText("#", canvas.width - 690, canvas.height - 165);

					// Draw title
					ctx.font = "45px RubikMonoOne";
					ctx.strokeStyle = "#000000";
					ctx.lineWidth = 10;
					ctx.strokeText(member.guild.translate("administration/welcome:TITLE"), canvas.width - 670, canvas.height - 330);
					ctx.fillStyle = "#FFFFFF";
					ctx.fillText(member.guild.translate("administration/welcome:TITLE"), canvas.width - 670, canvas.height - 330);

					// Draw avatar circle
					ctx.beginPath();
					ctx.lineWidth = 10;
					ctx.strokeStyle = "#FFFFFF";
					ctx.arc(180, 225, 135, 0, Math.PI * 2, true);
					ctx.stroke();
					ctx.closePath();
					ctx.clip();
					const avatar = await Canvas.loadImage(member.user.displayAvatarURL({
						format: "png",
						size: 512
					}));
					ctx.drawImage(avatar, 45, 90, 270, 270);

					const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "welcome-image.png" });
					channel.send({
						content: message,
						files: [attachment]
					});
				} else {
					channel.send({
						content: message
					});
				}
			}
		}
	}
}

module.exports = GuildMemberAdd;