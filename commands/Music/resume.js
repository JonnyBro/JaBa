const Command = require("../../base/Command.js");

class Resume extends Command {
	constructor(client) {
		super(client, {
			name: "resume",
			dirname: __dirname,
			enabled: false,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message) {
		const voice = message.member.voice.channel;
		const queue = this.client.player.getQueue(message);

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return message.error("music:play:NOT_PLAYING");

		await this.client.player.resume(message);

		message.sendT("music/resume:SUCCESS");
	}
};

module.exports = Resume;