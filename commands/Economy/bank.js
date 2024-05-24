const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Bank extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("bank")
				.setDescription(client.translate("economy/bank:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/bank:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/bank:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addStringOption(option =>
					option
						.setName("option")
						.setDescription(client.translate("economy/bank:OPTION"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/bank:OPTION", null, "uk-UA"),
							ru: client.translate("economy/bank:OPTION", null, "ru-RU"),
						})
						.setRequired(true)
						.setChoices({ name: client.translate("economy/bank:DEPOSIT"), value: "deposit" }, { name: client.translate("economy/bank:WITHDRAW"), value: "withdraw" }),
				)
				.addStringOption(option =>
					option
						.setName("credits")
						.setDescription(client.translate("misc:OPTION_NAN_ALL"))
						.setDescriptionLocalizations({
							uk: client.translate("misc:OPTION_NAN_ALL", null, "uk-UA"),
							ru: client.translate("misc:OPTION_NAN_ALL", null, "ru-RU"),
						})
						.setRequired(true),
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
		const memberData = interaction.data.member,
			choice = interaction.options.getString("option");

		if (choice === "deposit") {
			const credits = interaction.options.getString("credits").toLowerCase() === "all" ? memberData.money : interaction.options.getString("credits");

			if (isNaN(credits) || credits < 1) return interaction.error("misc:OPTION_NAN_ALL");
			if (memberData.money < credits)
				return interaction.error("economy/bank:NOT_ENOUGH_CREDIT", {
					money: `**${credits}** ${client.functions.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
				});

			memberData.money -= credits;
			memberData.bankSold += credits;

			await memberData.save();

			const info = {
				user: interaction.translate("economy/transactions:BANK"),
				amount: credits,
				date: Date.now(),
				type: "send",
			};
			memberData.transactions.push(info);

			interaction.success("economy/bank:SUCCESS_DEP", {
				money: `**${credits}** ${client.functions.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
			});
		} else {
			const credits = interaction.options.getString("credits") === "all" ? memberData.bankSold : interaction.options.getString("credits");

			if (isNaN(credits) || credits < 1) return interaction.error("misc:OPTION_NAN_ALL");
			if (memberData.bankSold < credits)
				return interaction.error("economy/bank:NOT_ENOUGH_BANK", {
					money: `**${credits}** ${client.functions.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
				});

			const info = {
				user: interaction.translate("economy/transactions:BANK"),
				amount: credits,
				date: Date.now(),
				type: "got",
			};

			memberData.transactions.push(info);

			memberData.money += credits;
			memberData.bankSold -= credits;

			await memberData.save();

			interaction.success("economy/bank:SUCCESS_WD", {
				money: `**${credits}** ${client.functions.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
			});
		}
	}
}

module.exports = Bank;
