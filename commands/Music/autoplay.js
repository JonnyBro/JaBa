const Command = require("../../base/Command.js");

class AutoPlay extends Command {
	constructor(client) {
		super(client, {
			name: "autoplay",
			dirname: __dirname,
			enabled: true,
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
		if (!queue) return message.error("music/play:NOT_PLAYING");

		const autoplay = queue.toggleAutoplay()

		message.success(`music/autoplay:SUCCESS_${autoplay ? "ENABLED" : "DISABLED"}`);
	}
};

module.exports = AutoPlay;