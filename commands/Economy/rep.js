const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Rep extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
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
		const isInCooldown = data.userData.cooldowns?.rep;
		if (isInCooldown) {
			if (isInCooldown > Date.now())
				return interaction.error("economy/rep:COOLDOWN", {
					time: client.functions.convertTime(client, isInCooldown, true, true, data.guildData.language),
				});
		}

		const user = interaction.options.getUser("user");
		if (user.bot) return interaction.error("economy/rep:BOT_USER");
		if (user.id === interaction.user.id) return interaction.error("economy/rep:YOURSELF");

		const toWait = Date.now() + 21600000; // 12 hours
		if (!data.userData.cooldowns) data.userData.cooldowns = {};

		data.userData.cooldowns.rep = toWait;

		data.userData.markModified();
		await data.userData.save();

		const userData = await client.findOrCreateUser(user.id);

		userData.rep++;

		if (!userData.achievements.rep.achieved) {
			userData.achievements.rep.progress.now = userData.rep > userData.achievements.rep.progress.total ? userData.achievements.rep.progress.total : userData.rep;
			if (userData.achievements.rep.progress.now >= userData.achievements.rep.progress.total) {
				userData.achievements.rep.achieved = true;
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

		userData.markModified();
		await userData.save();

		interaction.success("economy/rep:SUCCESS", {
			user: user.toString(),
		});
	}
}

module.exports = Rep;
