const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Achievements extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("achievements")
				.setDescription(client.translate("economy/achievements:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/achievements:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/achievements:DESCRIPTION", null, "ru-RU"),
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
		const user = interaction.options.getUser("user") || interaction.member;
		if (user.bot) return interaction.error("economy/profile:BOT_USER");

		const userData = user.id === interaction.user.id ? interaction.data.user : await client.getUserData(user.id);

		const embed = client.embed({
			author: {
				name: interaction.translate("economy/achievements:TITLE"),
				iconURL: user.displayAvatarURL(),
			},
			fields: [
				{
					name: interaction.translate("economy/achievements:SEND_CMD"),
					value: interaction.translate("economy/achievements:PROGRESS", {
						now: userData.achievements.firstCommand.progress.now,
						total: userData.achievements.firstCommand.progress.total,
						percent: Math.round(100 * (userData.achievements.firstCommand.progress.now / userData.achievements.firstCommand.progress.total)),
					}),
				},
				{
					name: interaction.translate("economy/achievements:CLAIM_SALARY"),
					value: interaction.translate("economy/achievements:PROGRESS", {
						now: userData.achievements.work.progress.now,
						total: userData.achievements.work.progress.total,
						percent: Math.round(100 * (userData.achievements.work.progress.now / userData.achievements.work.progress.total)),
					}),
				},
				{
					name: interaction.translate("economy/achievements:MARRY"),
					value: interaction.translate("economy/achievements:PROGRESS", {
						now: userData.achievements.married.progress.now,
						total: userData.achievements.married.progress.total,
						percent: Math.round(100 * (userData.achievements.married.progress.now / userData.achievements.married.progress.total)),
					}),
				},
				{
					name: interaction.translate("economy/achievements:SLOTS"),
					value: interaction.translate("economy/achievements:PROGRESS", {
						now: userData.achievements.slots.progress.now,
						total: userData.achievements.slots.progress.total,
						percent: Math.round(100 * (userData.achievements.slots.progress.now / userData.achievements.slots.progress.total)),
					}),
				},
				{
					name: interaction.translate("economy/achievements:TIP"),
					value: interaction.translate("economy/achievements:PROGRESS", {
						now: userData.achievements.tip.progress.now,
						total: userData.achievements.tip.progress.total,
						percent: Math.round(100 * (userData.achievements.tip.progress.now / userData.achievements.tip.progress.total)),
					}),
				},
				{
					name: interaction.translate("economy/achievements:REP"),
					value: interaction.translate("economy/achievements:PROGRESS", {
						now: userData.achievements.rep.progress.now,
						total: userData.achievements.rep.progress.total,
						percent: Math.round(100 * (userData.achievements.rep.progress.now / userData.achievements.rep.progress.total)),
					}),
				},
				{
					name: interaction.translate("economy/achievements:INVITE"),
					value: interaction.translate("economy/achievements:PROGRESS", {
						now: userData.achievements.invite.progress.now,
						total: userData.achievements.invite.progress.total,
						percent: Math.round(100 * (userData.achievements.invite.progress.now / userData.achievements.invite.progress.total)),
					}),
				},
			],
		});

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Achievements;
