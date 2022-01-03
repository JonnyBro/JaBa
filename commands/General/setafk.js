const Command = require("../../base/Command.js");

class Setafk extends Command {
	constructor(client) {
		super(client, {
			name: "setafk",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["afk"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const reason = args.join(" ");
		if (!reason) return message.error("general/setafk:MISSING_REASON");
		if (reason === "delete") {
			if (data.userData.afk) {
				data.userData.afk = null;
				await data.userData.save();
				message.sendT("general/setafk:DELETED", {
					username: message.author.username
				});
			};
		};

		message.success("general/setafk:SUCCESS", {
			reason
		});

		data.userData.afk = reason;
		data.userData.save();
	}
};

module.exports = Setafk;