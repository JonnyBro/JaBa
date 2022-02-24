const Command = require("../../base/Command"),
	fetch = require("node-fetch");

class Clyde extends Command {
	constructor(client) {
		super(client, {
			name: "clyde",
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
		const text = args.join(" ");

		if (!text) return message.error("images/clyde:MISSING_TEXT");

		const m = await message.sendT("misc:PLEASE_WAIT", null, {
			prefixEmoji: "loading"
		});
		try {
			const res = await fetch(encodeURI(`https://nekobot.xyz/api/imagegen?type=clyde&text=${text}`));
			const json = await res.json();
			message.reply({
				files: [{
					name: "clyde.png",
					attachment: json.message
				}]
			});
			m.delete();
		} catch (e) {
			console.log(e);
			m.error("misc:ERR_OCCURRED", null, {
				edit: true
			});
		}
	}
}

module.exports = Clyde;