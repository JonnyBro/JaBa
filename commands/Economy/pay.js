const Command = require("../../base/Command.js");

class Pay extends Command {
	constructor(client) {
		super(client, {
			name: "pay",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000
		});
	}

	async run(message, args, data) {
		const member = await this.client.resolveMember(args[0], message.guild);
		if (!member) return message.error("economy/pay:INVALID_MEMBER");
		if (member.user.bot) return message.error("economy/pay:BOT_USER");
		if (member.id === message.author.id) return message.error("economy/pay:YOURSELF");

		const sentAmount = args[1];
		if (!sentAmount || isNaN(sentAmount) || parseInt(sentAmount, 10) <= 0) return message.error("economy/pay:INVALID_AMOUNT", { username: member.user.tag });

		const amount = Math.ceil(parseInt(sentAmount, 10));
		if (amount > data.memberData.money) return message.error("economy/pay:ENOUGH_MONEY", {
			amount: `${amount} ${this.client.getNoun(amount, message.translate("misc:NOUNS:CREDITS:1"), message.translate("misc:NOUNS:CREDITS:2"), message.translate("misc:NOUNS:CREDITS:5"))}`
		});

		const memberData = await this.client.findOrCreateMember({
			id: member.id,
			guildID: message.guild.id
		});

		data.memberData.money = data.memberData.money - parseInt(amount, 10);
		data.memberData.save();

		memberData.money = memberData.money + parseInt(amount, 10);
		memberData.save();

		message.success("economy/pay:SUCCESS", {
			amount: `${amount} ${this.client.getNoun(amount, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`,
			username: member.user.tag
		});
	}
};

module.exports = Pay;