const Command = require("../../base/Command.js");

class Loop extends Command {
	constructor (client) {
		super(client, {
			name: "loop",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run (message, args) {
		const voice = message.member.voice.channel;
		const queue = this.client.player.getQueue(message);

		if (!args[0]) return message.error("music/loop:NO_ARG");
		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return message.error("music/play:NOT_PLAYING");

		if (args[0].toLowerCase() === "queue") {
			if (!queue.loopMode) {
				client.player.setLoopMode(message, true);
				message.success("music:/loop:QUEUE", { loop: "включён" });
			} else {
				client.player.setLoopMode(message, false);
				message.success("music:/loop:QUEUE", { loop: "отключён" });
			};
		} else if (args[0].toLowerCase() === "song") {
			if (!queue.repeatMode) {
				client.player.setRepeatMode(message, true);
				message.success("music:/loop:QUEUE", { loop: "включён" });
			} else if (args[1].toLowerCase() == "off") {
				client.player.setRepeatMode(message, false);
				message.success("music:/loop:QUEUE", { loop: "отключён" });
			};
		};
	}
};

module.exports = Loop;