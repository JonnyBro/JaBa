const Command = require("../../base/Command");

class SteamCard extends Command {
	constructor(client) {
		super(client, {
			name: "steamcard",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["sc"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args) {
		const nArgs = args.join(" ").split(new RegExp(/ <@!(\d+)>/));
		if (!args[0]) return message.error("images/qrcode:MISSING_TEXT");

		const user = await this.client.resolveUser(nArgs[1]) || message.author;
		const m = await message.sendT("misc:PLEASE_WAIT", null, {
			prefixEmoji: "loading"
		});
		const buffer = await this.client.AmeAPI.generate("steamcard", {
			text: nArgs[0],
			url: user.displayAvatarURL({
				format: "png",
				size: 512
			})
		});
		m.delete();

		message.channel.send({
			files: [{
				name: "steamcard.png",
				attachment: buffer
			}]
		});
	}
}

module.exports = SteamCard;