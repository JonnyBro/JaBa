const Command = require("../../base/Command");

class Loop extends Command {
	constructor(client) {
		super(client, {
			name: "loop",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["repeat", "l"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args) {
		const voice = message.member.voice.channel;
		const type = args[0];
		const queue = this.client.player.getQueue(message);

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return message.error("music/play:NOT_PLAYING");

		let mode = null;
		if (type === "queue") {
			mode = this.client.player.setRepeatMode(message, 2);
		} else if (type === "song") {
			mode = this.client.player.setRepeatMode(message, 1);
		} else {
			mode = this.client.player.setRepeatMode(message, 0);
		}

		message.success(`music/loop:${mode ? mode === 2 ? "QUEUE" : "SONG" : "DISABLED"}`);
	}
}

module.exports = Loop;