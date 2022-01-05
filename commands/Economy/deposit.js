const Command = require("../../base/Command.js");

class Deposit extends Command {
	constructor(client) {
		super(client, {
			name: "deposit",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["bank", "dep"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		let amount = args[0];

		if (!(parseInt(data.memberData.money, 10) > 0)) return message.error("economy/deposit:NO_CREDIT");

		if (args[0] === "all") {
			amount = parseInt(data.memberData.money, 10);
		} else {
			if (isNaN(amount) || parseInt(amount, 10) < 1) return message.error("economy/deposit:MISSING_AMOUNT");
			amount = parseInt(amount, 10);
		};

		if (data.memberData.money < amount) return message.error("economy/deposit:NOT_ENOUGH_CREDIT", { money: `**${amount}** ${message.getNoun(amount, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}` });

		const info = {
			user: message.translate("economy/transactions:BANK"),
			amount: amount,
			date: Date.now(),
			type: "send"
		};

		data.memberData.transactions.push(info);

		data.memberData.money = data.memberData.money - amount;
		data.memberData.bankSold = data.memberData.bankSold + amount;
		data.memberData.save();

		message.success("economy/deposit:SUCCESS", {
			money: `**${amount}** ${message.getNoun(amount, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`
		});
	}
};

module.exports = Deposit;