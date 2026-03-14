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
	// valid url i guess :shrug:
	if (!attachment.match(/^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i))
		return await editReplyError(interaction, "administration/addemoji:INVALID_LINK");

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
