const Command = require("../../base/Command.js"),
	Discord = require("discord.js"),
	canvacord = require("canvacord");

class YouTubeComment extends Command {
	constructor(client) {
		super(client, {
			name: "youtube-comment",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["ytcomment"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000
		});
	}

	async run(message, args) {
		let user = await this.client.resolveUser(args[0]);
		let text = args.join(" ");

		if (user) {
			text = args.slice(1).join(" ");
		} else {
			user = message.author;
		};

		if (!text) return message.error("images/phcomment:MISSING_TEXT"); // same text as phcomment

		const m = await message.sendT("misc:PLEASE_WAIT", null, {
			prefixEmoji: "loading"
		});
		const image = await canvacord.Canvas.youtube({
			username: user.username,
			avatar: user.displayAvatarURL({
				format: "png"
			}),
			content: text
		});
		m.delete();

		message.channel.send({
			files: [{
				attachment: image
			}]
		});
	}
};

module.exports = YouTubeComment;