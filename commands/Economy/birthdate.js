const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Birthdate extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("birthdate")
				.setDescription(client.translate("economy/birthdate:DESCRIPTION"))
				.addStringOption(option => option.setName("date")
					.setDescription(client.translate("economy/birthdate:DATE"))
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
		const date = interaction.options.getString("date");
		const match = date.match(/\d+/g);
		if (!match) return interaction.error("economy/birthdate:INVALID_DATE");
		const [day, month, year] = date.split("/");
		if (!day || !month || !year) return interaction.error("economy/birthdate:INVALID_DATE");

		const d = new Date(year, month - 1, day);
		if (!(day == d.getDate() && month - 1 == d.getMonth() && year == d.getFullYear())) return interaction.error("economy/birthdate:INVALID_DATE");
		if (d.getTime() > Date.now()) return interaction.error("economy/birthdate:DATE_TOO_HIGH");
		if (d.getTime() < (Date.now() - 2.523e+12)) return interaction.error("economy/birthdate:DATE_TOO_LOW");

		data.userData.birthdate = d;
		await data.userData.save();

		interaction.success("economy/birthdate:SUCCESS", {
			date: client.printDate(d)
		});
	}
}

module.exports = Birthdate;