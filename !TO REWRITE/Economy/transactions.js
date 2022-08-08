const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Transactions extends Command {
	constructor(client) {
		super(client, {
			name: "transactions",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["tr"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.translate("economy/transactions:EMBED_TRANSACTIONS"),
				iconURL: message.author.displayAvatarURL({
					extension: "png",
					size: 512
				})
			})
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		const transactions = data.memberData.transactions,
			sortedTransactions = [ [], [] ];

		transactions.slice(-20).forEach((t) => {
			const array = t.type === "got" ? sortedTransactions[0] : sortedTransactions[1];
			array.push(`${message.translate("economy/transactions:T_USER_" + t.type.toUpperCase())}: ${t.user}\n${message.translate("economy/transactions:T_AMOUNT")}: ${t.amount}\n${message.translate("economy/transactions:T_DATE")}: ${this.client.printDate(t.date, "Do MMMM YYYY, HH:mm")}\n`);
		});

		if (transactions.length < 1) {
			embed.setDescription(message.translate("economy/transactions:NO_TRANSACTIONS"));
		} else {
			if (sortedTransactions[0].length > 0) embed.addFields([
				{
					name: message.translate("economy/transactions:T_GOT"),
					value: sortedTransactions[0].join("\n"),
					inline: true
				}
			]);
			if (sortedTransactions[1].length > 0) embed.addFields([
				{
					name: message.translate("economy/transactions:T_SEND"),
					value: sortedTransactions[1].join("\n"),
					inline: true
				}
			]);
		}

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Transactions;