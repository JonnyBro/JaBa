const Command = require("../../base/Command.js");

class Setwarns extends Command {
	constructor(client) {
		super(client, {
			name: "setwarns",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["setw"],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "BAN_MEMBERS", "KICK_MEMBERS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const sanction = args[0];
		if (!sanction || (sanction !== "kick" && sanction !== "ban")) return message.error("moderation/setwarns:MISSING_TYPE");

		const number = args[1];

		if (number === "reset") {
			if (sanction === "kick") {
				data.guild.plugins.warnsSanctions.kick = false;
				data.guild.markModified("plugins.warnsSanctions");
				data.guild.save();
				return message.success("moderation/setwarns:SUCCESS_KICK_RESET", {
					prefix: data.guild.prefix,
					count: `${number} ${message.getNoun(number, message.translate("misc:NOUNS:WARNS:1"), message.translate("misc:NOUNS:WARNS:2"), message.translate("misc:NOUNS:WARNS:5"))}`
				});
			} else if (sanction === "ban") {
				data.guild.plugins.warnsSanctions.ban = false;
				data.guild.markModified("plugins.warnsSanctions");
				data.guild.save();
				return message.success("moderation/setwarns:SUCCESS_BAN_RESET", {
					prefix: data.guild.prefix,
					count: `${number} ${message.getNoun(number, message.translate("misc:NOUNS:WARNS:1"), message.translate("misc:NOUNS:WARNS:2"), message.translate("misc:NOUNS:WARNS:5"))}`
				});
			}
		}

		if (!number || isNaN(number)) return message.error("misc:INVALID_NUMBER");
		if (number < 1 || number > 10) return message.error("misc:INVALID_NUMBER_RANGE", 1, 10);

		if (sanction === "kick") {
			data.guild.plugins.warnsSanctions.kick = number;
			data.guild.markModified("plugins.warnsSanctions");
			data.guild.save();
			return message.success("moderation/setwarns:SUCCESS_KICK", {
				prefix: data.guild.prefix,
				count: `${number} ${message.getNoun(number, message.translate("misc:NOUNS:WARNS:1"), message.translate("misc:NOUNS:WARNS:2"), message.translate("misc:NOUNS:WARNS:5"))}`
			});
		} else if (sanction === "ban") {
			data.guild.plugins.warnsSanctions.ban = number;
			data.guild.markModified("plugins.warnsSanctions");
			data.guild.save();
			return message.success("moderation/setwarns:SUCCESS_BAN", {
				prefix: data.guild.prefix,
				count: `${number} ${message.getNoun(number, message.translate("misc:NOUNS:WARNS:1"), message.translate("misc:NOUNS:WARNS:2"), message.translate("misc:NOUNS:WARNS:5"))}`
			});
		}
	}
}

module.exports = Setwarns;