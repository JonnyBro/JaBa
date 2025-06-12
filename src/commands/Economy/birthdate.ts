import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "birthdate",
	...getLocalizedDesc("economy/birthdate:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [
		InteractionContextType.BotDM,
		InteractionContextType.Guild,
		InteractionContextType.PrivateChannel,
	],
	options: [
		{
			name: "clear",
			...getLocalizedDesc("economy/birthdate:CLEAR"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "ephemeral",
					type: ApplicationCommandOptionType.Boolean,
					...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
				},
			],
		},
		{
			name: "set",
			...getLocalizedDesc("economy/birthdate:SET"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "day",
					...getLocalizedDesc("economy/birthdate:DAY"),
					type: ApplicationCommandOptionType.Integer,
					required: true,
				},
				{
					name: "month",
					...getLocalizedDesc("economy/birthdate:MONTH"),
					type: ApplicationCommandOptionType.Integer,
					required: true,
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
					required: true,
				},
				{
					name: "ephemeral",
					type: ApplicationCommandOptionType.Boolean,
					...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
				},
			],
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const subcommand = interaction.options.getSubcommand();
	const userData = await client.getUserData(interaction.user.id);

	switch (subcommand) {
		case "clear":
			userData.set("birthdate", null);
			await userData.save();

			return editReplySuccess(interaction, "economy/birthdate:SUCCESS_CLEAR");

		case "set": {
			const day = interaction.options.getInteger("day", true);
			const month = interaction.options.getInteger("month", true);
			const year = interaction.options.getInteger("year", true);
			const date = new Date(year, month - 1, day); // NOTE: Months are 0-based in JS

			// This should be the same day in all timezones
			date.setHours(13);

			const time = date.getTime();

			if (
				!(
					day === date.getDate() &&
					month === date.getMonth() + 1 &&
					year === date.getFullYear()
				)
			) {
				return editReplyError(interaction, "economy/birthdate:INVALID_DATE");
			}
			if (date.getTime() > Date.now()) {
				return editReplyError(interaction, "economy/birthdate:DATE_TOO_HIGH");
			}
			if (date.getTime() < Date.now() - 2.523e12) {
				return editReplyError(interaction, "economy/birthdate:DATE_TOO_LOW");
			}

			userData.set("birthdate", time);

			await userData.save();

			return editReplySuccess(interaction, "economy/birthdate:SUCCESS", {
				date: `<t:${Math.floor(time / 1000)}:D>`,
			});
		}
	}
};
