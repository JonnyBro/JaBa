const Command = require("../../base/Command.js");

class Set extends Command {
	constructor(client) {
		super(client, {
			name: "set",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args) {
		const status = args[0];
		if (!status || !["level", "xp", "credits", "bank"].includes(status)) return message.error("administration/set:NO_STATUS");

		const member = await this.client.resolveMember(args[1], message.guild);
		if (!member) return message.error("administration/set:INVALID_MEMBER");
		if (member.user.bot) return message.error("administration/set:BOT_USER");

		const number = args[2];
		if (!number || isNaN(number) || parseInt(number, 10) < 0) return message.error("administration/set:INVALID_AMOUNT");
		const amount = Math.ceil(parseInt(number, 10));

		const memberData = await this.client.findOrCreateMember({
			id: member.id,
			guildID: message.guild.id
		});

		if (status === "level") {
			memberData.level = parseInt(amount, 10);
			memberData.save();
		} else if (status === "xp") {
			memberData.exp = parseInt(amount, 10);
			memberData.save();
		} else if (status === "credits") {
			memberData.money = parseInt(amount, 10);
			memberData.save();
		} else if (status === "bank") {
			memberData.bankSold = parseInt(amount, 10);
			memberData.save();
		}

		message.success("administration/set:SUCCESS_" + status.toUpperCase(), {
			username: member.user.tag,
			amount
		});
	}
}

module.exports = Set;