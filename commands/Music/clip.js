const Command = require("../../base/Command.js"),
	fs = require("fs");

class Clip extends Command {
	constructor (client) {
		super(client, {
			name: "clip",
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

		if (!args[0]) return message.error("music/clip:NO_ARG");
		if (!fs.existsSync(`./clips/${args[0]}.mp3`)) return message.error("music/clip:NO_FILE", { file: args[0] });
		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (queue) return message.error("music/clip:ACTIVE_QUEUE");

		try {
			const connection = await voice.join();
			await connection.voice.setSelfDeaf(true);

			connection
				.play(`./clips/${args[0]}.mp3`)
				.on("finish", () => {
					voice.leave();
				})
				.on("error", err => {
					voice.leave();
					console.error(err);
				});
		} catch (error) {
			console.error(error);
		};
	}
};

module.exports = Clip;