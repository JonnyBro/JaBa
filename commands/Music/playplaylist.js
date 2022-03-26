const Command = require("../../base/Command"),
	DisTube = require("distube"),
	{ Permissions } = require("discord.js");

class PlayPlaylists extends Command {
	constructor(client) {
		super(client, {
			name: "playplaylist",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["ppl"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args, data) {
		const voice = message.member.voice.channel;
		const name = args.join(" ");
		let playlist;
		for (const pl of data.userData.playlists) {
			if (pl.name === name) {
				playlist = new DisTube.Playlist(pl);
			} else {
				return message.error("music/removeplaylist:NOT_FOUND", {
					name
				});
			}
		}

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");

		// Check my permissions
		const perms = voice.permissionsFor(this.client.user);
		if (!perms.has(Permissions.FLAGS.CONNECT) || !perms.has(Permissions.FLAGS.SPEAK)) return message.error("music/play:VOICE_CHANNEL_CONNECT");

		try {
			this.client.player.play(message.member.voice.channel, playlist, {
				member: message.member,
				textChannel: message.channel,
				message
			});
		} catch (e) {
			message.error("music/play:ERR_OCCURRED", {
				error: e
			});
			console.error(e);
		}
	}
}

module.exports = PlayPlaylists;