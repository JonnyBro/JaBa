const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Rob extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("rob")
				.setDescription(client.translate("economy/rob:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/rob:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/rob:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
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
		if (otherMember.id === interaction.member.id) return interaction.error("economy/rob:YOURSELF");

		const amount = interaction.options.getInteger("amount");
		if (amount <= 0) return interaction.error("misc:MORE_THAN_ZERO");

		const otherMemberData = await client.findOrCreateMember({
			id: otherMember.id,
			guildId: interaction.guildId,
		});
		if (amount > otherMemberData.money) return interaction.error("economy/rob:NOT_ENOUGH_MEMBER", { user: otherMember.toString() });

		const isInCooldown = otherMemberData.cooldowns.rob || 0;
		if (isInCooldown) {
			if (isInCooldown > Date.now()) return interaction.error("economy/rob:COOLDOWN", { user: otherMember.toString() });
		}

		const potentiallyLose = Math.floor(amount * 1.5);
		if (potentiallyLose > memberData.money)
			return interaction.error("economy/rob:NOT_ENOUGH_AUTHOR", {
				moneyMin: `**${potentiallyLose}** ${client.functions.getNoun(potentiallyLose, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
				moneyCurrent: `**${memberData.money}** ${client.functions.getNoun(memberData.money, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
			});

		const itsAWon = Math.floor(client.functions.randomNum(0, 100) < 25);

		if (itsAWon) {
			const toWait = Date.now() + 6 * 60 * 60 * 1000,
				randomNum = client.functions.randomNum(1, 2);

			otherMemberData.cooldowns.rob = toWait;

			otherMemberData.markModified("cooldowns");
			await otherMemberData.save();

			interaction.replyT("economy/rob:ROB_WON_" + randomNum, {
				money: `**${amount}** ${client.functions.getNoun(amount, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
				user: otherMember.toString(),
			});

			memberData.money += amount;
			otherMemberData.money -= amount;

			memberData.markModified("money");
			otherMemberData.markModified("money");
			await memberData.save();
			await otherMemberData.save();
		} else {
			const won = Math.floor(amount * 0.9),
				randomNum = client.functions.randomNum(1, 2);

			interaction.replyT("economy/rob:ROB_LOSE_" + randomNum, {
				fine: `**${potentiallyLose}** ${client.functions.getNoun(potentiallyLose, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
				offset: `**${won}** ${client.functions.getNoun(won, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
				user: otherMember.toString(),
			});

			memberData.money -= potentiallyLose;
			otherMemberData.money += won;

			memberData.markModified("money");
			otherMemberData.markModified("money");
			await memberData.save();
			await otherMemberData.save();
		}
	}
}

module.exports = Rob;
