const Command = require("../../base/Command");

class CreatePlaylist extends Command {
	constructor(client) {
		super(client, {
			name: "createplaylist",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["cpl", "createpl"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args, data) {
		if (!args) return message.error("music/createplaylist:NO_NAME");
		args = args.join(" ").split(" | ");

		const name = args[0];
		const songs = args[1].split(" ");
		if (!name) return message.error("music/createplaylist:NO_NAME");
		if (!songs) return message.error("music/createplaylist:NO_SONGS");

		const playlist = await this.client.player.createCustomPlaylist(songs, {
			member: message.member,
			properties: {
				name
			},
			parallel: true
		});

		data.userData.playlists.push(playlist);
		data.userData.markModified("playlists");
		data.userData.save();

		message.success("music/createplaylist:CREATED", {
			name
		});
	}
}

module.exports = CreatePlaylist;