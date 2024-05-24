const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Birthdate extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("birthdate")
				.setDescription(client.translate("economy/birthdate:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/birthdate:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/birthdate:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true)
				.addIntegerOption(option =>
					option
						.setName("day")
						.setDescription(client.translate("economy/birthdate:DAY"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/birthdate:DAY", null, "uk-UA"),
							ru: client.translate("economy/birthdate:DAY", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addIntegerOption(option =>
					option
						.setName("month")
						.setDescription(client.translate("economy/birthdate:MONTH"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/birthdate:MONTH", null, "uk-UA"),
							ru: client.translate("economy/birthdate:MONTH", null, "ru-RU"),
						})
						.setRequired(true)
						.setChoices(
							{ name: client.translate("economy/birthdate:JANUARY"), value: 1 },
							{ name: client.translate("economy/birthdate:FEBRUARY"), value: 2 },
							{ name: client.translate("economy/birthdate:MARCH"), value: 3 },
							{ name: client.translate("economy/birthdate:APRIL"), value: 4 },
							{ name: client.translate("economy/birthdate:MAY"), value: 5 },
							{ name: client.translate("economy/birthdate:JUNE"), value: 6 },
							{ name: client.translate("economy/birthdate:JULY"), value: 7 },
							{ name: client.translate("economy/birthdate:AUGUST"), value: 8 },
							{ name: client.translate("economy/birthdate:SEPTEMBER"), value: 9 },
							{ name: client.translate("economy/birthdate:OCTOBER"), value: 10 },
							{ name: client.translate("economy/birthdate:NOVEMBER"), value: 11 },
							{ name: client.translate("economy/birthdate:DECEMBER"), value: 12 },
						),
				)
				.addIntegerOption(option =>
					option
						.setName("year")
						.setDescription(client.translate("economy/birthdate:YEAR"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/birthdate:YEAR", null, "uk-UA"),
							ru: client.translate("economy/birthdate:YEAR", null, "ru-RU"),
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
			day = interaction.options.getInteger("day"),
			month = interaction.options.getInteger("month"),
			year = interaction.options.getInteger("year"),
			date = new Date(year, month - 1, day);

		date.setHours(12);

		const d = Math.floor(date.getTime() / 1000);

		if (!(day == date.getDate() && month - 1 == date.getMonth() && year == date.getFullYear())) return interaction.error("economy/birthdate:INVALID_DATE");
		if (date.getTime() > Date.now()) return interaction.error("economy/birthdate:DATE_TOO_HIGH");
		if (date.getTime() < Date.now() - 2.523e12) return interaction.error("economy/birthdate:DATE_TOO_LOW");

		userData.birthdate = d;

		await userData.save();

		interaction.success("economy/birthdate:SUCCESS", {
			date: `<t:${d}:D>`,
		});
	}
}

module.exports = Birthdate;
