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
				.setDMPermission(false)
				.addIntegerOption(option => option.setName("day")
					.setDescription(client.translate("economy/birthdate:DAY"))
					.setRequired(true))
				.addIntegerOption(option => option.setName("month")
					.setDescription(client.translate("economy/birthdate:MONTH"))
					.setRequired(true)
					.addChoices(
						{ name: "Январь", value: 1 },
						{ name: "Февраль", value: 2 },
						{ name: "Март", value: 3 },
						{ name: "Апрель", value: 4 },
						{ name: "Май", value: 5 },
						{ name: "Июнь", value: 6 },
						{ name: "Июль", value: 7 },
						{ name: "Август", value: 8 },
						{ name: "Сентябрь", value: 9 },
						{ name: "Октябрь", value: 10 },
						{ name: "Ноябрь", value: 11 },
						{ name: "Декабрь", value: 12 },
					))
				.addIntegerOption(option => option.setName("year")
					.setDescription(client.translate("economy/birthdate:YEAR"))
					.setRequired(true)),
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
		const day = interaction.options.getInteger("day"),
			month = interaction.options.getInteger("month"),
			year = interaction.options.getInteger("year");

		const d = new Date(year, month - 1, day);
		if (!(day == d.getDate() && month - 1 == d.getMonth() && year == d.getFullYear())) return interaction.error("economy/birthdate:INVALID_DATE");
		if (d.getTime() > Date.now()) return interaction.error("economy/birthdate:DATE_TOO_HIGH");
		if (d.getTime() < (Date.now() - 2.523e+12)) return interaction.error("economy/birthdate:DATE_TOO_LOW");

		data.userData.birthdate = d;
		await data.userData.save();

		interaction.success("economy/birthdate:SUCCESS", {
			date: client.printDate(d),
		});
	}
}

module.exports = Birthdate;