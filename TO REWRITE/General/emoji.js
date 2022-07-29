const Command = require("../../base/Command"),
	Discord = require("discord.js");

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

		const parsedEmoji = Discord.Util.parseEmoji(rawEmoji);

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.translate("general/emoji:TITLE", {
					emoji: parsedEmoji.name
				})
			})
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			})
			.addField(message.translate("general/emoji:NAME"), parsedEmoji.name)
			.addField(message.translate("general/emoji:ANIMATED"), parsedEmoji.animated ? message.translate("common:YES") : message.translate("common:NO"))
			.addField(message.translate("general/emoji:ID"), parsedEmoji.id ? parsedEmoji.id.toString() : message.translate("general/emoji:STANDART"));

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = EmojiInfo;