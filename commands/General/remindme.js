const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	ms = require("ms");

class Remindme extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("remindme")
				.setDescription(client.translate("general/remindme:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/remindme:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/remindme:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("time")
						.setDescription(client.translate("general/remindme:TIME"))
						.setDescriptionLocalizations({
							uk: client.translate("general/remindme:TIME", null, "uk-UA"),
							ru: client.translate("general/remindme:TIME", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName("message")
						.setDescription(client.translate("common:MESSAGE"))
						.setDescriptionLocalizations({
							uk: client.translate("common:MESSAGE", null, "uk-UA"),
							ru: client.translate("common:MESSAGE", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addBooleanOption(option =>
					option
						.setName("ephemeral")
						.setDescription(client.translate("misc:EPHEMERAL_RESPONSE"))
						.setDescriptionLocalizations({
							uk: client.translate("misc:EPHEMERAL_RESPONSE", null, "uk-UA"),
							ru: client.translate("misc:EPHEMERAL_RESPONSE", null, "ru-RU"),
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
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral") || false });

		const conditions = ["s", "m", "h", "d", "w", "y"],
			time = interaction.options.getString("time"),
			message = interaction.options.getString("message");

		if (!conditions.some(s => time.includes(s))) return interaction.error("general/remindme:TIME", null, { edit: true });

		const userData = interaction.data.user;

		if (!userData.reminds) userData.reminds = [];

		const dateNow = Date.now();

		const reminder = {
			message: message,
			createdAt: Math.floor(dateNow / 1000),
			sendAt: Math.floor((dateNow + ms(time)) / 1000),
		};

		userData.reminds.push(reminder);

		await userData.save();

		client.databaseCache.usersReminds.set(interaction.user.id, userData);

		const embed = client.embed({
			author: interaction.translate("general/remindme:EMBED_SAVED"),
			fields: [
				{
					name: interaction.translate("general/remindme:EMBED_TIME"),
					value: `<t:${reminder.sendAt}:R>`,
				},
				{
					name: interaction.translate("common:MESSAGE"),
					value: reminder.message,
				},
			],
		});

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Remindme;
