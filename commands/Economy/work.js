const { SlashCommandBuilder, parseEmoji } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Work extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("work")
				.setDescription(client.translate("economy/work:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/work:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/work:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
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
		const { member: memberData, user: userData } = interaction.data,
			isInCooldown = memberData.cooldowns?.work;

		if (isInCooldown && isInCooldown > Date.now())
			return interaction.error("economy/work:COOLDOWN", {
				time: `<t:${Math.floor(isInCooldown / 1000)}:R>`,
			});

		if (Date.now() > memberData.cooldowns.work + 30 * 60 * 60 * 1000) memberData.workStreak = 0;

		memberData.cooldowns.work = Date.now() + 24 * 60 * 60 * 1000;
		memberData.workStreak = (memberData.workStreak || 0) + 1;

		const embed = client.embed({
			footer: {
				text: interaction.translate("economy/work:AWARD"),
				iconURL: interaction.member.displayAvatarURL(),
			},
		});

		const award = [client.customEmojis.letters.a, client.customEmojis.letters.w, client.customEmojis.letters.a, client.customEmojis.letters.r, client.customEmojis.letters.d];
		let won = 200;

		if (memberData.workStreak >= 5) {
			won += 200;
			embed.data.fields = [
				{
					name: interaction.translate("economy/work:SALARY"),
					value: interaction.translate("economy/work:SALARY_CONTENT", {
						won: `**${won}** ${client.functions.getNoun(won, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					}),
				},
				{
					name: interaction.translate("economy/work:STREAK"),
					value: interaction.translate("economy/work:STREAK_CONTENT"),
				},
			];

			memberData.workStreak = 0;
		} else {
			for (let i = 0; i < award.length; i++) {
				if (memberData.workStreak > i) {
					const letter = parseEmoji(award[i]).name.split("_")[1];
					award[i] = `:regional_indicator_${letter.toLowerCase()}:`;
				}
			}
			embed.data.fields = [
				{
					name: interaction.translate("economy/work:SALARY"),
					value: interaction.translate("economy/work:SALARY_CONTENT", {
						won: `**${won}** ${client.functions.getNoun(won, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					}),
				},
				{
					name: interaction.translate("economy/work:STREAK"),
					value: award.join(""),
				},
			];
		}

		memberData.money += won;

		const info = {
			user: interaction.translate("economy/work:SALARY"),
			amount: won,
			date: Date.now(),
			type: "got",
		};
		memberData.transactions.push(info);

		const messageOptions = {
			embeds: [embed],
		};

		if (!userData.achievements.work.achieved) {
			userData.achievements.work.progress.now += 1;
			if (userData.achievements.work.progress.now === userData.achievements.work.progress.total) {
				messageOptions.files = [
					{
						name: "unlocked.png",
						attachment: "./assets/img/achievements/achievement_unlocked1.png",
					},
				];
				userData.achievements.work.achieved = true;
			}

			userData.markModified("achievements");
			await userData.save();
		}

		memberData.markModified("cooldowns");
		await memberData.save();

		interaction.reply(messageOptions);
	}
}

module.exports = Work;
