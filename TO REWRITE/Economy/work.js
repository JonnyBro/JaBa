const Command = require("../../base/Command"),
	{ parseEmoji, EmbedBuilder } = require("discord.js");

class Work extends Command {
	constructor(client) {
		super(client, {
			name: "work",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["salary", "daily"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		// if the member is already in the cooldown db
		const isInCooldown = data.memberData.cooldowns.work;
		if (isInCooldown) {
			/*if the timestamp recorded in the database indicating
			when the member will be able to execute the order again
			is greater than the current date, display an error message */
			if (isInCooldown > Date.now()) return message.error("economy/work:COOLDOWN", {
				time: this.client.convertTime(isInCooldown, "to", true)
			});
		}

		if (Date.now() > data.memberData.cooldowns.work + (24 * 3600000)) data.memberData.workStreak = 0;

		// Records in the database the time when the member will be able to execute the command again (in 12 hours)
		const toWait = Date.now() + 43200000;
		data.memberData.cooldowns.work = toWait;
		data.memberData.markModified("cooldowns");

		data.memberData.workStreak = (data.memberData.workStreak || 0) + 1;
		await data.memberData.save();

		const embed = new EmbedBuilder()
			.setFooter({
				text: message.translate("economy/work:AWARD"),
				iconURL: message.author.displayAvatarURL({
					size: 512,
					format: "png"
				})
			})
			.setColor(data.config.embed.color);

		const award = [
			this.client.customEmojis.letters.a,
			this.client.customEmojis.letters.w,
			this.client.customEmojis.letters.a,
			this.client.customEmojis.letters.r,
			this.client.customEmojis.letters.d
		];
		let won = 200;

		if (data.memberData.workStreak >= 5) {
			won += 200;
			embed.addFields([
				{
					name: message.translate("economy/work:SALARY"),
					value: message.translate("economy/work:SALARY_CONTENT", {
						won: `${won} ${message.getNoun(won, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`
					})
				},
				{
					name: message.translate("economy/work:STREAK"),
					value: message.translate("economy/work:STREAK_CONTENT")
				}
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
					name: message.translate("economy/work:SALARY"),
					value: message.translate("economy/work:SALARY_CONTENT", {
						won: `**${won}** ${message.getNoun(won, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`
					})
				},
				{
					name: message.translate("economy/work:STREAK"),
					value: award.join("")
				}
			]);
		}

		const info = {
			user: message.translate("economy/work:SALARY"),
			amount: won,
			date: Date.now(),
			type: "got"
		};

		data.memberData.transactions.push(info);
		data.memberData.money = data.memberData.money + won;
		data.memberData.save();

		const messageOptions = {
			embeds: [embed]
		};
		if (!data.userData.achievements.work.achieved) {
			data.userData.achievements.work.progress.now += 1;
			if (data.userData.achievements.work.progress.now === data.userData.achievements.work.progress.total) {
				messageOptions.files = [{
					name: "unlocked.png",
					attachment: "./assets/img/achievements/achievement_unlocked1.png"
				}];
				data.userData.achievements.work.achieved = true;
			}
			data.userData.markModified("achievements.work");
			data.userData.save();
		}

		// Send the embed in the current channel
		message.reply(messageOptions);
	}
}

module.exports = Work;