const Command = require("../../base/Command.js");
const ms = require("ms");

class Seek extends Command {
	constructor (client) {
		super(client, {
			name: "seek",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run (message, args) {
		const voice = message.member.voice.channel;
		const queue = this.client.player.getQueue(message);

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return message.error("music/play:NOT_PLAYING");

		const time = ms(args[0]);
		if (isNaN(time)) return message.error("music/seek:INVALID_TIME");

		await this.client.player.seek(message, time);

		message.sendT("music/seek:SUCCESS");
	}
};

module.exports = Seek;