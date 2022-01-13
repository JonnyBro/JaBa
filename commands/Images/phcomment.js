const Command = require("../../base/Command"),
	canvacord = require("canvacord");

class Phcomment extends Command {
	constructor(client) {
		super(client, {
			name: "phcomment",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: [],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args) {
		let user = await this.client.resolveUser(args[0]);
		let text = args.join(" ");

		if (user) text = args.slice(1).join(" ");
		else user = message.author;

		if (!text) return message.error("images/phcomment:MISSING_TEXT");

		const m = await message.sendT("misc:PLEASE_WAIT", null, {
			prefixEmoji: "loading"
		});

		try {
			const buffer = await canvacord.Canvas.phub({
				username: user.username,
				image: user.displayAvatarURL({
					format: "png"
				}),
				message: text
			});
			m.delete();

			message.channel.send({
				files: [{
					attachment: buffer
				}]
			});
		} catch (e) {
			console.log(e);
			m.error("misc:ERR_OCCURRED", null, {
				edit: true
			});
		}
	}
}

module.exports = Phcomment;