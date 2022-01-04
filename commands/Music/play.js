const Command = require("../../base/Command.js"),
	{ Permissions } = require("discord.js");

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
		const voice = message.member.voice.channel;
		const name = args.join(" ");
		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!name) return message.error("music/play:MISSING_SONG_NAME");

		// Check my permissions
		const perms = voice.permissionsFor(this.client.user);
		if (!perms.has(Permissions.FLAGS.CONNECT) || !perms.has(Permissions.FLAGS.SPEAK)) return message.error("music/play:VOICE_CHANNEL_CONNECT");

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