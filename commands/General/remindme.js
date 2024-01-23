const { SlashCommandBuilder } = require("discord.js");
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
		// TODO: rework this shit
		const time = interaction.options.getString("time"),
			message = interaction.options.getString("message"),
			dateNow = Date.now();

		const reminderData = {
			message: message,
			createdAt: dateNow,
			sendAt: dateNow + ms(time),
		};

		data.userData.reminds.push(reminderData);

		data.userData.markModified("reminds");
		await data.userData.save();

		client.databaseCache.usersReminds.set(interaction.user.id, data.userData);

		interaction.success("general/remindme:SAVED", {
			message,
			time: moment(reminderData.sendAt).locale(interaction.getLocale()).format("Do MMMM YYYY, HH:mm:ss"),
		}, { edit: true });
	}
}

module.exports = Remindme;
