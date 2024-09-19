const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Pay extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("pay")
				.setDescription(client.translate("economy/pay:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/pay:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/pay:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addIntegerOption(option =>
					option
						.setName("amount")
						.setDescription(client.translate("common:INT"))
						.setDescriptionLocalizations({
							uk: client.translate("common:INT", null, "uk-UA"),
							ru: client.translate("common:INT", null, "ru-RU"),
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
			otherMember = interaction.options.getMember("user");
		if (otherMember.user.bot) return interaction.error("economy/pay:BOT_USER");
		if (otherMember.id === interaction.member.id) return interaction.error("misc:CANT_YOURSELF");

		const amount = interaction.options.getInteger("amount");
		if (amount <= 0) return interaction.error("misc:MORE_THAN_ZERO");
		if (amount > memberData.money)
			return interaction.error("economy/pay:ENOUGH_MONEY", {
				amount: `**${amount}** ${client.functions.getNoun(amount, interaction.translate("misc:NOUNS:CREDITS:1"), interaction.translate("misc:NOUNS:CREDITS:2"), interaction.translate("misc:NOUNS:CREDITS:5"))}`,
			});

		const otherMemberData = await client.getMemberData(otherMember.id, interaction.guildId);

		memberData.money -= amount;
		otherMemberData.money += amount;

		const info1 = {
			user: otherMember.user.getUsername(),
			amount: amount,
			date: Date.now(),
			type: "send",
		};
		memberData.transactions.push(info1);

		const info2 = {
			user: otherMember.user.getUsername(),
			amount: amount,
			date: Date.now(),
			type: "got",
		};
		otherMemberData.transactions.push(info2);

		await memberData.save();
		await otherMemberData.save();

		interaction.success("economy/pay:SUCCESS", {
			user: otherMember.toString(),
			amount: `**${amount}** ${client.functions.getNoun(amount, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
		});
	}
}

module.exports = Pay;
