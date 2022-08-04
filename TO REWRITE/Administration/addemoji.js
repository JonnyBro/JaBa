const Command = require("../../base/Command");

class Addemoji extends Command {
	constructor(client) {
		super(client, {
			name: "addemoji",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["adde"],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args) {
		const url = args[0];
		if (!url) return message.error("administration/addemoji:MISSING_URL");

		const name = args[1] ? args[1].replace(/[^a-z0-9]/gi, "") : null;
		if (!name) return message.error("administration/addemoji:MISSING_NAME");
		if (name.length < 2 || name.length > 32) return message.error("administration/addemoji:INVALID_NAME");

		message.guild.emojis
			.create(url, name)
			.then(emoji => message.success("administration/addemoji:SUCCESS", {
				emoji: emoji.name
			}))
			.catch(() => message.error("administration/addemoji:ERROR", {
				emoji: name
			}));
	}
}

module.exports = Addemoji;