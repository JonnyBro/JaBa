const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Bank extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("bank")
				.setDescription(client.translate("economy/bank:DESCRIPTION"))
				.addStringOption(option => option.setName("option")
					.setDescription(client.translate("economy/bank:OPTION"))
					.setRequired(true)
					.addChoices(
						{ name: client.translate("economy/bank:DEPOSIT"), value: "deposit" },
						{ name: client.translate("economy/bank:WITHDRAW"), value: "withdraw" }
					))
				.addStringOption(option => option.setName("credits")
					.setDescription(client.translate("moderation/clear:OPTION"))
					.setRequired(true)),
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
		const choice = interaction.options.getString("option");

		if (choice === "deposit") {
			const credits = interaction.options.getString("credits") === "all" ? data.memberData.money : interaction.options.getString("credits");
			if (isNaN(credits) || credits < 1) return interaction.error("misc:OPTION_NAN_ALL");
			if (data.memberData.money < credits) return interaction.error("economy/bank:NOT_ENOUGH_CREDIT", { money: `**${credits}** ${client.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}` });

			const info = {
				user: interaction.translate("economy/transactions:BANK"),
				amount: credits,
				date: Date.now(),
				type: "send"
			};

			data.memberData.transactions.push(info);

			data.memberData.money -= credits;
			data.memberData.bankSold += credits;
			await data.memberData.save();

			interaction.success("economy/bank:SUCCESS_DEP", {
				money: `**${credits}** ${client.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`
			});
		} else {
			const credits = interaction.options.getString("credits") === "all" ? data.memberData.bankSold : interaction.options.getString("credits");
			if (isNaN(credits) || credits < 1) return interaction.error("misc:OPTION_NAN_ALL");
			if (data.memberData.bankSold < credits) return interaction.error("economy/bank:NOT_ENOUGH_BANK", { money: `**${credits}** ${client.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}` });

			const info = {
				user: interaction.translate("economy/transactions:BANK"),
				amount: credits,
				date: Date.now(),
				type: "got"
			};

			data.memberData.transactions.push(info);

			data.memberData.money += credits;
			data.memberData.bankSold -= credits;
			await data.memberData.save();

			interaction.success("economy/bank:SUCCESS_WD", {
				money: `**${credits}** ${client.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`
			});
		}
	}
}

module.exports = Bank;