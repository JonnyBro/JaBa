const Command = require("../../base/Command"),
	{ EmbedBuilder, parseEmoji } = require("discord.js");

class EmojiInfo extends Command {
	constructor(client) {
		super(client, {
			name: "emoji",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["emi"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const rawEmoji = args[0];
		if (!rawEmoji) return message.error("administration/stealemoji:MISSING_EMOJI");

		const parsedEmoji = parseEmoji(rawEmoji);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: message.translate("general/emoji:TITLE", {
					emoji: parsedEmoji.name
				})
			})
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			})
			.addFields([
				{
					name: message.translate("general/emoji:NAME"),
					value: parsedEmoji.name
				},
				{
					name: message.translate("general/emoji:ANIMATED"),
					value: parsedEmoji.animated ? message.translate("common:YES") : message.translate("common:NO")
				},
				{
					name: message.translate("general/emoji:ID"),
					value: parsedEmoji.id ? parsedEmoji.id.toString() : message.translate("general/emoji:STANDART")
				}
			]);

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = EmojiInfo;