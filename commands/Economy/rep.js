const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Rep extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("rep")
				.setDescription(client.translate("economy/rep:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/rep:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/rep:DESCRIPTION", null, "ru-RU"),
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
		const userData = interaction.data.user,
			isInCooldown = userData.cooldowns?.rep;

		if (isInCooldown) {
			if (isInCooldown > Date.now())
				return interaction.error("economy/rep:COOLDOWN", {
					time: `<t:${Math.floor(isInCooldown / 1000)}:R>`,
				});
		}

		const user = interaction.options.getUser("user");
		if (user.bot) return interaction.error("economy/rep:BOT_USER");
		if (user.id === interaction.user.id) return interaction.error("misc:CANT_YOURSELF");

		const toWait = Math.floor((Date.now() + 12 * 60 * 60 * 1000) / 1000); // 12 hours
		if (!userData.cooldowns) userData.cooldowns = {};

		userData.cooldowns.rep = toWait;

		const otherUserData = await client.getUserData(user.id);

		otherUserData.rep++;

		if (!otherUserData.achievements.rep.achieved) {
			otherUserData.achievements.rep.progress.now = otherUserData.rep > otherUserData.achievements.rep.progress.total ? otherUserData.achievements.rep.progress.total : otherUserData.rep;
			if (otherUserData.achievements.rep.progress.now >= otherUserData.achievements.rep.progress.total) {
				otherUserData.achievements.rep.achieved = true;
				interaction.followUp({
					content: `${user}`,
					files: [
						{
							name: "achievement_unlocked6.png",
							attachment: "./assets/img/achievements/achievement_unlocked6.png",
						},
					],
				});
			}
		}

		await userData.save();
		await otherUserData.save();

		interaction.success("economy/rep:SUCCESS", {
			user: user.toString(),
		});
	}
}

module.exports = Rep;
