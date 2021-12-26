const Command = require("../../base/Command.js");

class Loop extends Command {
	constructor(client) {
		super(client, {
			name: "loop",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["repeat"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args) {
		const voice = message.member.voice.channel;
		const queue = this.client.player.getQueue(message);

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return message.error("music/play:NOT_PLAYING");

		const mode = this.client.player.setRepeatMode(message);

		message.success(`music/loop:${mode ? mode === 2 ? "QUEUE" : "SONG" : "DISABLED"}`)
	}
};

module.exports = Loop;