const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
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
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel])
				.addIntegerOption(option =>
					option
						.setName("day")
						.setDescription(client.translate("economy/birthdate:DAY"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/birthdate:DAY", null, "uk-UA"),
							ru: client.translate("economy/birthdate:DAY", null, "ru-RU"),
						}),
				)
				.addIntegerOption(option =>
					option
						.setName("month")
						.setDescription(client.translate("economy/birthdate:MONTH"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/birthdate:MONTH", null, "uk-UA"),
							ru: client.translate("economy/birthdate:MONTH", null, "ru-RU"),
						})
						.setChoices(
							{ name: client.translate("misc:MONTHS:JANUARY"), value: 1 },
							{ name: client.translate("misc:MONTHS:FEBRUARY"), value: 2 },
							{ name: client.translate("misc:MONTHS:MARCH"), value: 3 },
							{ name: client.translate("misc:MONTHS:APRIL"), value: 4 },
							{ name: client.translate("misc:MONTHS:MAY"), value: 5 },
							{ name: client.translate("misc:MONTHS:JUNE"), value: 6 },
							{ name: client.translate("misc:MONTHS:JULY"), value: 7 },
							{ name: client.translate("misc:MONTHS:AUGUST"), value: 8 },
							{ name: client.translate("misc:MONTHS:SEPTEMBER"), value: 9 },
							{ name: client.translate("misc:MONTHS:OCTOBER"), value: 10 },
							{ name: client.translate("misc:MONTHS:NOVEMBER"), value: 11 },
							{ name: client.translate("misc:MONTHS:DECEMBER"), value: 12 },
						),
				)
				.addIntegerOption(option =>
					option
						.setName("year")
						.setDescription(client.translate("economy/birthdate:YEAR"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/birthdate:YEAR", null, "uk-UA"),
							ru: client.translate("economy/birthdate:YEAR", null, "ru-RU"),
						}),
				)
				.addBooleanOption(option =>
					option
						.setName("clear")
						.setDescription(client.translate("economy/birthdate:CLEAR"))
						.setDescriptionLocalizations({
							uk: client.translate("economy/birthdate:CLEAR", null, "uk-UA"),
							ru: client.translate("economy/birthdate:CLEAR", null, "ru-RU"),
						}),
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

		const userData = interaction.data.user;

		if (interaction.options.getBoolean("clear")) {
			userData.birthdate = null;
			await userData.save();

			return interaction.success("economy/birthdate:SUCCESS", {
				date: "none",
			}, { edit: true });
		}

		const day = interaction.options.getInteger("day"),
			month = interaction.options.getInteger("month"),
			year = interaction.options.getInteger("year"),
			date = new Date(year, month - 1, day);

		date.setHours(12);

		const d = Math.floor(date.getTime() / 1000);

		if (!(day == date.getDate() && month - 1 == date.getMonth() && year == date.getFullYear())) return interaction.error("economy/birthdate:INVALID_DATE", null, { edit: true });
		if (date.getTime() > Date.now()) return interaction.error("economy/birthdate:DATE_TOO_HIGH", null, { edit: true });
		if (date.getTime() < Date.now() - 2.523e12) return interaction.error("economy/birthdate:DATE_TOO_LOW", null, { edit: true });

		userData.birthdate = d;

		await userData.save();

		interaction.success("economy/birthdate:SUCCESS", {
			date: `<t:${d}:D>`,
		}, { edit: true });
	}
}

module.exports = Birthdate;
