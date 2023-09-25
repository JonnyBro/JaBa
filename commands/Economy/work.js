const { SlashCommandBuilder, EmbedBuilder, parseEmoji } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Work extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
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
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
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
		const isInCooldown = data.memberData.cooldowns?.work;
		if (isInCooldown) {
			if (isInCooldown > Date.now())
				return interaction.error("economy/work:COOLDOWN", {
					time: client.functions.convertTime(client, isInCooldown, true, true, data.guildData.language),
				});
		}
		if (Date.now() > data.memberData.cooldowns.work + 24 * 60 * 60 * 1000) data.memberData.workStreak = 0;

		const toWait = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
		data.memberData.cooldowns.work = toWait;
		data.memberData.workStreak = (data.memberData.workStreak || 0) + 1;

		data.memberData.markModified("cooldowns");
		data.memberData.markModified("workStreak");

		await data.memberData.save();

		const embed = new EmbedBuilder()
			.setFooter({
				text: interaction.translate("economy/work:AWARD"),
				iconURL: interaction.member.displayAvatarURL(),
			})
			.setColor(client.config.embed.color);

		const award = [client.customEmojis.letters.a, client.customEmojis.letters.w, client.customEmojis.letters.a, client.customEmojis.letters.r, client.customEmojis.letters.d];
		let won = 200;

		if (data.memberData.workStreak >= 5) {
			won += 200;
			embed.addFields([
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
			]);
			data.memberData.workStreak = 0;
		} else {
			for (let i = 0; i < award.length; i++) {
				if (data.memberData.workStreak > i) {
					const letter = parseEmoji(award[i]).name.split("_")[1];
					award[i] = `:regional_indicator_${letter.toLowerCase()}:`;
				}
			}
			embed.addFields([
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
			]);
		}

		data.memberData.money += won;

		data.memberData.markModified("money");
		await data.memberData.save();

		const info = {
			user: interaction.translate("economy/work:SALARY"),
			amount: won,
			date: Date.now(),
			type: "got",
		};
		data.memberData.transactions.push(info);

		const messageOptions = {
			embeds: [embed],
		};

		if (!data.userData.achievements.work.achieved) {
			data.userData.achievements.work.progress.now += 1;
			if (data.userData.achievements.work.progress.now === data.userData.achievements.work.progress.total) {
				messageOptions.files = [
					{
						name: "unlocked.png",
						attachment: "./assets/img/achievements/achievement_unlocked1.png",
					},
				];
				data.userData.achievements.work.achieved = true;
			}

			data.userData.markModified("achievements.work");
			await data.userData.save();
		}

		interaction.reply(messageOptions);
	}
}

module.exports = Work;
