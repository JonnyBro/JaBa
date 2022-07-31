const Command = require("../../base/Command"),
	{ parseEmoji } = require("discord.js");

class Stealemoji extends Command {
	constructor(client) {
		super(client, {
			name: "stealemoji",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["steale"],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args) {
		if (!args.length) return message.error("administration/stealemoji:MISSING_EMOJI");

		for (const rawEmoji of args) {
			const parsedEmoji = parseEmoji(rawEmoji);
			const extension = parsedEmoji.animated ? "gif" : "png";

			message.guild.emojis
				.create(`https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${extension}`, parsedEmoji.name)
				.then(emoji => message.success("administration/stealemoji:SUCCESS", {
					emoji: emoji.name
				}))
				.catch(() => message.error("administration/stealemoji:ERROR", {
					emoji: parsedEmoji.name
				}));
		}
	}
}

module.exports = Stealemoji;