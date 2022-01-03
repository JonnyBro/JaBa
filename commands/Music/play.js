const Command = require("../../base/Command.js");

class Play extends Command {
	constructor(client) {
		super(client, {
			name: "play",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["p"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args) {
		const name = args.join(" ");
		if (!name) return message.error("music/play:MISSING_SONG_NAME");

		const voice = message.member.voice.channel;
		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");

		// Check my permissions
		const perms = voice.permissionsFor(this.client.user);
		if (!perms.has("CONNECT") || !perms.has("SPEAK")) return message.error("music/play:VOICE_CHANNEL_CONNECT");

		try {
			this.client.player.play(message, args.join(" "));
		} catch (e) {
			message.error("music/play:ERR_OCCURRED", {
				error: e
			});
			console.error(e);
		}
	}
};

module.exports = Play;