import { editReplyError, getLocalizedDesc, getNoun, translateContext } from "@/helpers/functions.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";
import ms, { StringValue } from "ms";

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
		{
			name: "ephemeral",
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
			type: ApplicationCommandOptionType.Boolean,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const conditions = ["s", "m", "h", "d", "w", "y"];
	const time = interaction.options.getString("time", true);
	const message = interaction.options.getString("message", true);

	if (!conditions.some(s => time.includes(s))) return editReplyError(interaction, "general/remindme:TIME");

	const userData = await client.getUserData(interaction.user.id);
	const dateNow = Date.now();

	const reminder = {
		message: message,
		createdAt: Math.floor(dateNow / 1000),
		sendAt: Math.floor((dateNow + ms(time as StringValue)) / 1000),
	};

	await userData.updateOne({
		$push: { reminds: reminder },
	});

	await userData.save();

	const embed = createEmbed({
		author: {
			name: await translateContext(interaction, "general/remindme:EMBED_SAVED"),
		},
		fields: [
			{
				name: await translateContext(interaction, "general/remindme:EMBED_TIME"),
				value: `<t:${reminder.sendAt}:R>`,
			},
			{
				name: await translateContext(interaction, "common:MESSAGE"),
				value: reminder.message,
			},
		],
	});

	interaction.editReply({
		embeds: [embed],
	});
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
				await translateContext(interaction, "misc:NOUNS:SECONDS:1"),
				await translateContext(interaction, "misc:NOUNS:SECONDS:2"),
				await translateContext(interaction, "misc:NOUNS:SECONDS:5"),
			])}`,
			value: `${query}s`,
		},
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
