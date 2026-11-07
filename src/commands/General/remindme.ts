import { editReplyError, getLocalizedDesc, getNoun, translateContext } from "@/helpers/functions.js";
import { isValidRemindDelay, parseDuration } from "@/helpers/reminds.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import { containerMessage, createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "remindme",
	...getLocalizedDesc("general/remindme:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "message",
			...getLocalizedDesc("common:MESSAGE"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "time",
			...getLocalizedDesc("general/remindme:TIME"),
			type: ApplicationCommandOptionType.String,
			autocomplete: true,
			required: true,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const time = interaction.options.getString("time", true);
	const message = interaction.options.getString("message", true);
	const duration = parseDuration(time);

	// Cron jobs run every minute, so we can't do seconds here
	if (!duration || !isValidRemindDelay(duration)) return editReplyError(interaction, "general/remindme:ERROR_TIME");

	const userData = await client.getUserData(interaction.user.id);
	const dateNow = Date.now();

	const reminder = {
		message: message,
		createdAt: Math.floor(dateNow / 1000),
		sendAt: Math.floor((dateNow + duration) / 1000),
	};

	await userData.updateOne({
		$push: { reminds: reminder },
	});

	await userData.save();

	const container = createContainer().addTextDisplayComponents(
		createText(`## ⏰ ${await translateContext(interaction, "general/remindme:EMBED_SAVED")}`),
		createText(`-# ${await translateContext(interaction, "general/remindme:EMBED_TIME")} <t:${reminder.sendAt}:R>`),
		createText(reminder.message),
	);

	await interaction.editReply(containerMessage(container));
};

export const autocompleteRun = async ({ interaction }: AutocompleteProps) => {
	let query: string | number = interaction.options.getFocused();

	if (isNaN(Number(query)))
		return await interaction.respond([
			{
				name: query.toString(),
				value: query.toString(),
			},
		]);

	query = Number(query);

	const results = [
		{
			name: `${query} ${getNoun(query, [
				await translateContext(interaction, "misc:NOUNS:MINUTES:1"),
				await translateContext(interaction, "misc:NOUNS:MINUTES:2"),
				await translateContext(interaction, "misc:NOUNS:MINUTES:5"),
			])}`,
			value: `${query}m`,
		},
		{
			name: `${query} ${getNoun(query, [
				await translateContext(interaction, "misc:NOUNS:HOURS:1"),
				await translateContext(interaction, "misc:NOUNS:HOURS:2"),
				await translateContext(interaction, "misc:NOUNS:HOURS:5"),
			])}`,
			value: `${query}h`,
		},
		{
			name: `${query} ${getNoun(query, [
				await translateContext(interaction, "misc:NOUNS:DAYS:1"),
				await translateContext(interaction, "misc:NOUNS:DAYS:2"),
				await translateContext(interaction, "misc:NOUNS:DAYS:5"),
			])}`,
			value: `${query}d`,
		},
	];

	await interaction.respond(results);
};
