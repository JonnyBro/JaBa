const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	ms = require("ms");

class Remindme extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("remindme")
				.setDescription(client.translate("general/remindme:DESCRIPTION"))
				.addStringOption(option => option.setName("time")
					.setDescription(client.translate("owner/remindme:TIME"))
					.setRequired(true))
				.addStringOption(option => option.setName("message")
					.setDescription(client.translate("common:MESSAGE"))
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: false
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
		const time = interaction.options.getString("time");
		const message = interaction.options.getString("message");
		const dateNow = Date.now();
		if (!data.userData.reminds) data.userData.reminds = [];

		const rData = {
			message: message,
			createdAt: dateNow,
			sendAt: dateNow + ms(time)
		};

		data.userData.reminds.push(rData);
		data.userData.markModified("reminds");
		data.userData.save();
		client.databaseCache.usersReminds.set(interaction.member.id, data.userData);

		interaction.success("general/remindme:SAVED");
	}
}

module.exports = Remindme;