import { getLocalizedDesc, replyError, replySuccess } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType, MessageFlags } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "birthdate",
	...getLocalizedDesc("economy/birthdate:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "day",
			...getLocalizedDesc("economy/birthdate:DAY"),
			type: ApplicationCommandOptionType.Integer,
		},
		{
			name: "month",
			...getLocalizedDesc("economy/birthdate:MONTH"),
			type: ApplicationCommandOptionType.Integer,
			choices: [
				{ name: client.i18n.translate("misc:MONTHS:JANUARY"), value: 1 },
				{ name: client.i18n.translate("misc:MONTHS:FEBRUARY"), value: 2 },
				{ name: client.i18n.translate("misc:MONTHS:MARCH"), value: 3 },
				{ name: client.i18n.translate("misc:MONTHS:APRIL"), value: 4 },
				{ name: client.i18n.translate("misc:MONTHS:MAY"), value: 5 },
				{ name: client.i18n.translate("misc:MONTHS:JUNE"), value: 6 },
				{ name: client.i18n.translate("misc:MONTHS:JULY"), value: 7 },
				{ name: client.i18n.translate("misc:MONTHS:AUGUST"), value: 8 },
				{ name: client.i18n.translate("misc:MONTHS:SEPTEMBER"), value: 9 },
				{ name: client.i18n.translate("misc:MONTHS:OCTOBER"), value: 10 },
				{ name: client.i18n.translate("misc:MONTHS:NOVEMBER"), value: 11 },
				{ name: client.i18n.translate("misc:MONTHS:DECEMBER"), value: 12 },
			],
		},
		{
			name: "year",
			...getLocalizedDesc("economy/birthdate:YEAR"),
			type: ApplicationCommandOptionType.Integer,
		},
		{
			name: "clear",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("economy/birthdate:CLEAR"),
		},
		{
			name: "ephemeral",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined });

	const userData = await client.getUserData(interaction.user.id);

	if (interaction.options.getBoolean("clear")) {
		userData.birthdate = null;
		await userData.save();

		return replySuccess(interaction, "economy/birthdate:SUCCESS", { date: "none" }, { edit: true });
	}

	const day = interaction.options.getInteger("day", true),
		month = interaction.options.getInteger("month", true),
		year = interaction.options.getInteger("year", true),
		date = new Date(year, month - 1, day);

	// This should be the same day in all timezones
	date.setHours(13);

	const d = date.getTime();

	if (!(day === date.getDate() && month - 1 === date.getMonth() && year === date.getFullYear())) return replyError(interaction, "economy/birthdate:INVALID_DATE", null, { edit: true });
	if (date.getTime() > Date.now()) return replyError(interaction, "economy/birthdate:DATE_TOO_HIGH", null, { edit: true });
	if (date.getTime() < Date.now() - 2.523e12) return replyError(interaction, "economy/birthdate:DATE_TOO_LOW", null, { edit: true });

	userData.birthdate = d;

	await userData.save();

	return replySuccess(
		interaction,
		"economy/birthdate:SUCCESS",
		{
			date: `<t:${Math.floor(d / 1000)}:D>`,
		},
		{
			edit: true,
		},
	);
};
