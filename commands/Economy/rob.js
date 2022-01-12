const Command = require("../../base/Command.js");

class Rob extends Command {
	constructor(client) {
		super(client, {
			name: "rob",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["steal"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const member = await this.client.resolveMember(args[0], message.guild);
		if (!member) return message.error("economy/rob:MISSING_MEMBER");
		if (member.id === message.author.id) return message.error("economy/rob:YOURSELF");

		const memberData = await this.client.findOrCreateMember({
			id: member.id,
			guildID: message.guild.id
		});
		const isInCooldown = memberData.cooldowns.rob || 0;
		if (isInCooldown) {
			if (isInCooldown > Date.now()) return message.error("economy/rob:COOLDOWN", { username: member.user.tag });
		}

		let amountToRob = args[1];
		if (!amountToRob || isNaN(amountToRob) || parseInt(amountToRob, 10) <= 0) return message.error("economy/rob:MISSING_AMOUNT", { username: member.user.username });

		amountToRob = Math.floor(parseInt(amountToRob, 10));

		if (amountToRob > memberData.money) return message.error("economy/rob:NOT_ENOUGH_MEMBER", { username: member.user.username });

		const potentiallyLose = Math.floor(amountToRob * 1.5);
		if (potentiallyLose > data.memberData.money) return message.error("economy/rob:NOT_ENOUGH_AUTHOR", {
			moneyMin: `${potentiallyLose} ${message.getNoun(potentiallyLose, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`,
			moneyCurrent: `${data.memberData.money} ${message.getNoun(data.memberData.money, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`
		});

		const itsAWon = Math.floor(this.client.functions.randomNum(0, 100) < 25);

		if (itsAWon) {
			const toWait = Date.now() + 6 * (60 * 60000); // 6 hours
			memberData.cooldowns.rob = toWait;
			memberData.markModified("cooldowns");
			await memberData.save();
			const randomNum = Math.floor(this.client.functions.randomNum(1, 3));
			message.sendT("economy/rob:ROB_WON_" + randomNum, {
				money: `${amountToRob} ${message.getNoun(amountToRob, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`,
				username: member.user.username
			});
			data.memberData.money += amountToRob;
			memberData.money -= amountToRob, 10;
			memberData.save();
			data.memberData.save();
		} else {
			const won = Math.floor(0.9 * amountToRob);
			const randomNum = Math.floor(this.client.functions.randomNum(1, 3));
			message.sendT("economy/rob:ROB_LOSE_" + randomNum, {
				fine: `${potentiallyLose} ${message.getNoun(potentiallyLose, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`,
				offset: `${won} ${message.getNoun(won, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`,
				username: member.user.username
			});
			data.memberData.money -= potentiallyLose;
			memberData.money += won;
			memberData.save();
			data.memberData.save();
		}
	}
}

module.exports = Rob;