const Command = require("../../base/Command.js"),
	fetch = require("node-fetch");

class Captcha extends Command {
	constructor(client) {
		super(client, {
			name: "captcha",
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
		const user = await this.client.resolveUser(args[0]) || message.author;
		const m = await message.sendT("misc:PLEASE_WAIT", null, {
			prefixEmoji: "loading"
		});
		try {
			const res = await fetch(encodeURI(`https://nekobot.xyz/api/imagegen?type=captcha&username=${user.username}&url=${user.displayAvatarURL({ format: "png", size: 512 })}`));
			const json = await res.json();
			m.delete();

			message.channel.send({
				files: [{
					attachment: json.message
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

module.exports = Captcha;