const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Transactions extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("transactions")
				.setDescription(client.translate("economy/transactions:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/transactions:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/transactions:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addBooleanOption(option =>
					option
						.setName("clear")
						.setDescription(client.translate("economy/transactions:CLEAR"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/transactions:CLEAR", null, "uk-UA"),
							ru: client.translate("economy/transactions:CLEAR", null, "ru-RU"),
						}),
				),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		const memberData = interaction.data.member;

		if (interaction.options.getBoolean("clear")) {
			memberData.transactions = [];

			memberData.markModified("transactions");
			await memberData.save();

			return interaction.success("economy/transactions:CLEARED", null, { ephemeral: true });
		}

		const embed = client.embed({
			author: {
				name: interaction.translate("economy/transactions:EMBED_TRANSACTIONS"),
				iconURL: interaction.member.displayAvatarURL(),
			},
		});
		const transactions = memberData.transactions,
			sortedTransactions = [[], []];

		transactions.slice(-20).forEach(t => {
			const array = t.type === "got" ? sortedTransactions[0] : sortedTransactions[1];
			array.push(
				`${interaction.translate("economy/transactions:T_USER_" + t.type.toUpperCase())}: ${t.user}\n${interaction.translate("economy/transactions:T_AMOUNT")}: ${t.amount}\n${interaction.translate(
					"economy/transactions:T_DATE",
				)}: <t:${Math.floor(t.date / 1000)}:f>\n`,
			);
		});

		if (transactions.length < 1) {
			embed.data.description = interaction.translate("economy/transactions:NO_TRANSACTIONS");
		} else {
			if (sortedTransactions[0].length > 0)
				embed.data.fields.push([
					{
						name: interaction.translate("economy/transactions:T_GOT"),
						value: sortedTransactions[0].join("\n"),
						inline: true,
					},
				]);
			if (sortedTransactions[1].length > 0)
				embed.data.fields.push([
					{
						name: interaction.translate("economy/transactions:T_SEND"),
						value: sortedTransactions[1].join("\n"),
						inline: true,
					},
				]);
		}

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Transactions;
