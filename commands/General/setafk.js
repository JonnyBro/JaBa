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
		if (!reason || reason.length > 250) return message.error("general/setafk:MISSING_REASON");

		if (reason === "delete") {
			if (data.userData.afk) {
				data.userData.afk = null;
				data.userData.save();

				return message.sendT("general/setafk:DELETED", {
					username: message.author.username
				});
			};
		} else {
			data.userData.afk = reason;
			data.userData.save();

			const m = await message.success("general/setafk:SUCCESS", {
				reason,
				prefix: message.guild ? data.guild.prefix : ""
			});

			setTimeout(() => {
				if (m.deletable) m.delete();
				if (message.deletable) message.delete();
			}, 10 * 1000);
		};
	}
};

module.exports = Setafk;