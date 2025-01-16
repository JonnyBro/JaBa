import { replyError, replySuccess } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "birthdate",
	description: client.translate("economy/birthdate:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	description_localizations: {
		uk: client.translate("economy/birthdate:DESCRIPTION", { lng: "uk-UA" }),
		ru: client.translate("economy/birthdate:DESCRIPTION", { lng: "ru-RU" }),
	},
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "day",
			description: client.translate("economy/birthdate:DAY"),
			type: ApplicationCommandOptionType.Integer,
			// eslint-disable-next-line camelcase
			description_localizations: {
				uk: client.translate("economy/birthdate:DAY", { lng: "uk-UA" }),
				ru: client.translate("economy/birthdate:DAY", { lng: "ru-RU" }),
			},
		},
		{
			name: "month",
			description: client.translate("economy/birthdate:MONTH"),
			type: ApplicationCommandOptionType.Integer,
			// eslint-disable-next-line camelcase
			description_localizations: {
				uk: client.translate("economy/birthdate:MONTH", { lng: "uk-UA" }),
				ru: client.translate("economy/birthdate:MONTH", { lng: "ru-RU" }),
			},
			choices: [
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
			],
		},
		{
			name: "year",
			description: client.translate("economy/birthdate:YEAR"),
			type: ApplicationCommandOptionType.Integer,
			// eslint-disable-next-line camelcase
			description_localizations: {
				uk: client.translate("economy/birthdate:YEAR", { lng: "uk-UA" }),
				ru: client.translate("economy/birthdate:YEAR", { lng: "ru-RU" }),
			},
		},
		{
			name: "clear",
			type: ApplicationCommandOptionType.Boolean,
			description: client.translate("economy/birthdate:CLEAR"),
			// eslint-disable-next-line camelcase
			description_localizations: {
				uk: client.translate("economy/birthdate:CLEAR", { lng: "uk-UA" }),
				ru: client.translate("economy/birthdate:CLEAR", { lng: "ru-RU" }),
			},
		},
		{
			name: "ephemeral",
			type: ApplicationCommandOptionType.Boolean,
			description: client.translate("misc:EPHEMERAL_RESPONSE"),
			// eslint-disable-next-line camelcase
			description_localizations: {
				uk: client.translate("misc:EPHEMERAL_RESPONSE", { lng: "uk-UA" }),
				ru: client.translate("misc:EPHEMERAL_RESPONSE", { lng: "ru-RU" }),
			},
		},
	],
};

export const run = async ({ interaction, client }: SlashCommandProps) => {
	await interaction.deferReply({
		ephemeral: interaction.options.getBoolean("ephemeral") || false,
	});

	const userData = await client.getUserData(interaction.user.id);

	if (interaction.options.getBoolean("clear")) {
		userData.birthdate = null;
		await userData.save();

		return replySuccess(
			interaction,
			"economy/birthdate:SUCCESS",
			{ data: "none" },
			{
				edit: true,
			},
		);
	}

	const day = interaction.options.getInteger("day")!,
		month = interaction.options.getInteger("month")!,
		year = interaction.options.getInteger("year")!,
		date = new Date(year, month - 1, day);

	date.setHours(12);

	const d = Math.floor(date.getTime() / 1000);

	if (!(day === date.getDate() && month - 1 === date.getMonth() && year === date.getFullYear())) {
		return replyError(interaction, "economy/birthdate:INVALID_DATE", null, { edit: true });
	}

	if (date.getTime() > Date.now()) {
		return replyError(interaction, "economy/birthdate:DATE_TOO_HIGH", null, { edit: true });
	}

	if (date.getTime() < Date.now() - 2.523e12) {
		replyError(interaction, "economy/birthdate:DATE_TOO_LOW", null, { edit: true });
	}

	userData.birthdate = d;

	await userData.save();

	return replySuccess(
		interaction,
		"economy/birthdate:SUCCESS",
		{
			date: `<t:${d}:D>`,
		},
		{
			edit: true,
		},
	);
};
