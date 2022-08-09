const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Transactions extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("transactions")
				.setDescription(client.translate("economy/transactions:DESCRIPTION")),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: false
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("economy/transactions:EMBED_TRANSACTIONS"),
				iconURL: interaction.member.displayAvatarURL()
			})
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			});

		const transactions = data.memberData.transactions,
			sortedTransactions = [ [], [] ];

		transactions.slice(-20).forEach(t => {
			const array = t.type === "got" ? sortedTransactions[0] : sortedTransactions[1];
			array.push(`${interaction.translate("economy/transactions:T_USER_" + t.type.toUpperCase())}: ${t.user}\n${interaction.translate("economy/transactions:T_AMOUNT")}: ${t.amount}\n${interaction.translate("economy/transactions:T_DATE")}: ${client.printDate(t.date, "Do MMMM YYYY, HH:mm", data.guildData.language)}\n`);
		});

		if (transactions.length < 1) {
			embed.setDescription(interaction.translate("economy/transactions:NO_TRANSACTIONS"));
		} else {
			if (sortedTransactions[0].length > 0) embed.addFields([
				{
					name: interaction.translate("economy/transactions:T_GOT"),
					value: sortedTransactions[0].join("\n"),
					inline: true
				}
			]);
			if (sortedTransactions[1].length > 0) embed.addFields([
				{
					name: interaction.translate("economy/transactions:T_SEND"),
					value: sortedTransactions[1].join("\n"),
					inline: true
				}
			]);
		}

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Transactions;