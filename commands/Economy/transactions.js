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
		const timestamp = Date.now() + (30 * 24 * 60 * 60 * 1000); // day hour min sec msec / 1 month
		const transactions = data.memberData.transactions;
		for (const t of transactions) {
			if (t.date > timestamp) {
				const index = transactions.indexOf(t);
				transactions.splice(index, 1);
			}
		}

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.translate("economy/transactions:EMBED_TRANSACTIONS"),
				iconURL: message.author.displayAvatarURL({
					size: 512,
					dynamic: true,
					format: "png"
				})
			})
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		const sortedTransactions = [ [], [] ];

		transactions.slice(-20).forEach((t) => {
			const array = t.type === "got" ? sortedTransactions[0] : sortedTransactions[1];
			array.push(`${message.translate("economy/transactions:T_USER_" + t.type.toUpperCase())}: ${t.user}\n${message.translate("economy/transactions:T_AMOUNT")}: ${t.amount}\n${message.translate("economy/transactions:T_DATE")}: ${message.printDate(t.date, "Do MMMM YYYY, HH:mm")}\n`);
		});

		if (transactions.length < 1) {
			embed.setDescription(message.translate("economy/transactions:NO_TRANSACTIONS"));
			return message.channel.send({
				embeds: [embed]
			});
		} else {
			embed.addField(message.translate("economy/transactions:T_GOT"), sortedTransactions[0].join("\n"), true);
			embed.addField(message.translate("economy/transactions:T_SEND"), sortedTransactions[1].join("\n"), true);
		}
		message.channel.send({
			embeds: [embed]
		});
	}
}

module.exports = Transactions;