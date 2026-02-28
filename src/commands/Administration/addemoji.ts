import { editReplyError, editReplySuccess, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

export const data: CommandData = {
	name: "addemoji",
	...getLocalizedDesc("administration/addemoji:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "string",
			...getLocalizedDesc("administration/addemoji:LINK_OR_EMOJI"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "name",
			...getLocalizedDesc("common:NAME"),
			type: ApplicationCommandOptionType.String,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const string = interaction.options.getString("string", true);
	const isEmoji = string.match(/<a?:(\w+):(\d+)>/i);
	let name = interaction.options.getString("name");
	let attachment = string;

	if (!name && isEmoji) {
		name = isEmoji[1];
		attachment = `https://cdn.discordapp.com/emojis/${isEmoji[2]}.${
			isEmoji[0].startsWith("<:a") ? "gif" : "webp"
		}?size=128`;
	}

	if (!name) return await editReplyError(interaction, "administration/addemoji:MISSING_NAME");

	try {
		const emoji = await interaction.guild?.emojis.create({ name, attachment });

		if (!emoji)
			return await editReplyError(interaction, "administration/addemoji:ERROR", {
				name,
				error: await translateContext(interaction, "misc:NO_BOT_PERMS"),
			});

		return await editReplySuccess(interaction, "administration/addemoji:SUCCESS", {
			emoji: emoji.toString(),
		});
	} catch (error) {
		await editReplyError(interaction, "administration/addemoji:ERROR", { name, error });
	}
};
