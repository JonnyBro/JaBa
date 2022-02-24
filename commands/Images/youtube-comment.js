const Command = require("../../base/Command"),
	canvacord = require("canvacord");

class Ytcomment extends Command {
	constructor(client) {
		super(client, {
			name: "ytcomment",
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

		message.reply({
			files: [{
				name: "ytcomment.png",
				attachment: image
			}]
		});
	}
}

module.exports = Ytcomment;