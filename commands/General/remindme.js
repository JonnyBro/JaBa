const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	ms = require("ms"),
	moment = require("moment");

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
				.setDMPermission(true)
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
				),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
		});
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		await interaction.deferReply({ ephemeral: true });

		if (!data.userData.reminds) data.userData.reminds = [];

		const dateNow = Date.now();

		const reminderData = {
			message: interaction.options.getString("message"),
			createdAt: dateNow,
			sendAt: dateNow + ms(interaction.options.getString("time")),
		};

		data.userData.reminds.push(reminderData);

		data.userData.markModified("reminds");
		await data.userData.save();

		client.databaseCache.usersReminds.set(interaction.user.id, data.userData);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("general/remindme:EMBED_SAVED"),
			})
			.addFields([
				{
					name: interaction.translate("general/remindme:EMBED_TIME"),
					value: moment(reminderData.sendAt).locale(interaction.getLocale()).format("Do MMMM YYYY, HH:mm:ss"),
				},
				{
					name: interaction.translate("common:MESSAGE"),
					value: reminderData.message,
				},
			])
			.setColor(client.config.embed.color)
			.setFooter(client.config.embed.footer);

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Remindme;
