const Command = require("../../base/Command.js"),
	ms = require("ms");

class Giveaway extends Command {
	constructor(client) {
		super(client, {
			name: "giveaway",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["gaway"],
			memberPermissions: ["MENTION_EVERYONE"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const status = args[0];
		if (!status) return message.error("moderation/giveaway:MISSING_STATUS");

		if (status === "create") {
			const currentGiveaways = this.client.giveawaysManager.giveaways.filter((g) => g.guildId === message.guild.id && !g.ended).length;
			if (currentGiveaways > 3) return message.error("moderation/giveaway:MAX_COUNT");

			const time = args[1];
			if (!time) return message.error("moderation/giveaway:INVALID_CREATE", { prefix: data.guild.prefix });
			if (isNaN(ms(time))) return message.error("misc:INVALID_TIME");
			if (ms(time) > ms("15d")) return message.error("moderation/giveaway:MAX_DURATION");

			const winnersCount = args[2];
			if (!winnersCount) return message.error("moderation/giveaway:INVALID_CREATE", { prefix: data.guild.prefix });
			if (isNaN(winnersCount) || winnersCount > 10 || winnersCount < 1) return message.error("misc:INVALID_NUMBER_RANGE", { min: 1, max: 10 });

			var drop = (args[3] === "true"),
				prize = args.slice(3).join(" ");

			if (drop) prize = args.slice(4).join(" ");
			else prize = args.slice(3).join(" ");

			if (!prize) return message.error("moderation/giveaway:INVALID_CREATE", { prefix: data.guild.prefix });

			this.client.giveawaysManager.start(message.channel, {
				duration: ms(time),
				winnerCount: parseInt(winnersCount, 10),
				prize: prize,
				hostedBy: message.author,
				isDrop: drop,
				messages: {
					giveaway: message.translate("moderation/giveaway:TITLE"),
					giveawayEnded: message.translate("moderation/giveaway:ENDED"),
					timeRemaining: message.translate("moderation/giveaway:TIME_REMAINING"),
					inviteToParticipate: message.translate("moderation/giveaway:INVITE_PARTICIPATE"),
					winMessage: message.translate("moderation/giveaway:WIN_MESSAGE"),
					drawing: message.translate("moderation/giveaway:DRAWING"),
					dropMessage: message.translate("moderation/giveaway:DROP"),
					embedFooter: message.translate("moderation/giveaway:FOOTER"),
					noWinner: message.translate("moderation/giveaway:NO_WINNER"),
					winners: message.translate("moderation/giveaway:WINNERS"),
					endedAt: message.translate("moderation/giveaway:END_AT"),
					hostedBy: message.translate("moderation/giveaway:HOSTEDBY"),
					units: {
						seconds: message.translate("time:SECONDS", {
							amount: ""
						}).trim(),
						minutes: message.translate("time:MINUTES", {
							amount: ""
						}).trim(),
						hours: message.translate("time:HOURS", {
							amount: ""
						}).trim(),
						days: message.translate("time:DAYS", {
							amount: ""
						}).trim()
					}
				}
			}).then(() => {
				message.success("moderation/giveaway:GIVEAWAY_CREATED");
			});
		} else if (status === "reroll") {
			const messageID = args[1];
			if (!messageID) return message.error("moderation/giveaway:MISSING_ID");

			this.client.giveawaysManager.reroll(messageID, {
				messages: {
					congrat: message.translate("moderation/giveaway:REROLL_CONGRAT"),
					error: message.translate("moderation/giveaway:REROLL_ERROR")
				}
			}).then(() => {
				return message.success("moderation/giveaway:GIVEAWAY_REROLLED");
			}).catch(() => {
				return message.error("moderation/giveaway:NOT_FOUND_ENDED", {
					messageID
				});
			});
		} else if (status === "delete") {
			const messageID = args[1];
			if (!messageID) return message.error("moderation/giveaway:MISSING_ID");

			this.client.giveawaysManager.delete(messageID).then(() => {
				return message.success("moderation/giveaway:GIVEAWAY_DELETED");
			}).catch(() => {
				return message.error("moderation/giveaway:NOT_FOUND", {
					messageID
				});
			});
		} else if (status === "end") {
			const messageID = args[1];
			if (!messageID) return message.error("moderation/giveaway:MISSING_ID");

			try {
				this.client.giveawaysManager.end(messageID);
				return message.success("moderation/giveaway:GIVEAWAY_ENDED");
			} catch (e) {
				return message.error("moderation/giveaway:NOT_FOUND", {
					messageID
				});
			}
		} else {
			return message.error("moderation/giveaway:MISSING_STATUS");
		}
	}
}

module.exports = Giveaway;