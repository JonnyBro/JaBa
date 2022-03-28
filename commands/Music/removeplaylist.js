const Command = require("../../base/Command");

class RemovePlaylist extends Command {
	constructor(client) {
		super(client, {
			name: "removeplaylist",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["rpl", "removepl"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args, data) {
		const name = args.join(" ");
		if (!name) return message.error("music/createplaylist:NO_NAME");

		const playlists = data.userData.playlists;
		for (const playlist of playlists) {
			if (playlist.name === name) {
				const index = playlists.indexOf(playlist);
				playlists.splice(index, 1);

				data.userData.markModified("playlists");
				data.userData.save();

				message.success("music/removeplaylist:REMOVED", {
					name
				});
			} else {
				message.error("music/removeplaylist:NOT_FOUND", {
					name
				});
			}
		}
	}
}

module.exports = RemovePlaylist;