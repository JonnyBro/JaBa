const Command = require("../../base/Command");

class Beautiful extends Command {
	constructor(client) {
		super(client, {
			name: "beautiful",
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
		const buffer = await this.client.AmeAPI.generate("beautiful", {
			url: user.displayAvatarURL({
				format: "png",
				size: 512
			})
		});
		m.delete();

		message.channel.send({
			files: [{
				attachment: buffer
			}]
		});
	}
}

module.exports = Beautiful;