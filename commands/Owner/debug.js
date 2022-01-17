const Command = require("../../base/Command");

class Debug extends Command {
	constructor(client) {
		super(client, {
			name: "debug",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["deb"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES"],
			nsfw: false,
			ownerOnly: true,
			cooldown: 3000
		});
	}

	async run(message, args) {
		const action = args[0];
		if (!action || !["set", "add"].includes(action)) return message.error("owner/debug:NO_ACTION");

		const status = args[1];
		if (!status || !["level", "xp", "credits", "bank", "rep"].includes(status)) return message.error("owner/debug:NO_STATUS");

		const member = await this.client.resolveMember(args[2], message.guild);
		if (!member) return message.error("owner/debug:INVALID_MEMBER");
		if (member.user.bot) return message.error("owner/debug:BOT_USER");

		const number = args[3];
		if (!number || isNaN(number)) return message.error("owner/debug:INVALID_AMOUNT");
		const amount = Math.ceil(parseInt(number, 10));

		const memberData = await this.client.findOrCreateMember({
			id: member.id,
			guildID: message.guild.id
		});

		const userData = await this.client.findOrCreateUser({
			id: member.id,
		});

		let newValue = 0;

		if (action === "set") {
			newValue = parseInt(amount, 10);

			if (status === "level") {
				memberData.level = newValue;
				memberData.save();
			} else if (status === "xp") {
				memberData.exp = newValue;
				memberData.save();
			} else if (status === "rep") {
				userData.rep = newValue;
				userData.save();
			} else if (status === "credits") {
				memberData.money = newValue;
				memberData.save();
			} else if (status === "bank") {
				memberData.bankSold = newValue;
				memberData.save();
			}

			message.success("owner/debug:SUCCESS_" + status.toUpperCase(), {
				username: member.user.tag,
				amount
			});
		} else if (action === "add") {
			if (status === "level") {
				newValue = memberData.level + parseInt(amount, 10);
				memberData.level = newValue;
				memberData.save();
			} else if (status === "xp") {
				newValue = memberData.exp + parseInt(amount, 10);
				memberData.exp = newValue;
				memberData.save();
			} else if (status === "rep") {
				newValue = userData.rep + parseInt(amount, 10);
				userData.rep = newValue;
				userData.save();
			} else if (status === "credits") {
				newValue = memberData.money + parseInt(amount, 10);
				memberData.money = newValue;
				memberData.save();
			} else if (status === "bank") {
				newValue = memberData.bankSold + parseInt(amount, 10);
				memberData.bankSold = newValue;
				memberData.save();
			}

			message.success("owner/debug:SUCCESS_" + status.toUpperCase(), {
				username: member.user.tag,
				amount: newValue
			});
		}
	}
}

module.exports = Debug;