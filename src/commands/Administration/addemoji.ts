import {
	editReplyError,
	editReplySuccess,
	getLocalizedDesc,
	translateContext,
} from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	parseEmoji,
} from "discord.js";

export const data: CommandData = {
	name: "addemoji",
	...getLocalizedDesc("administration/addemoji:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "link",
			...getLocalizedDesc("common:LINK"),
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

	let name = interaction.options.getString("name");
	const link = interaction.options.getString("link", true);
	const isEmoji = link.startsWith("<:");
	let attachment = link;

	if (!name && isEmoji) {
		const parsedEmoji = parseEmoji(link);

		if (parsedEmoji) {
			name = parsedEmoji.name;
			attachment = `https://cdn.discordapp.com/emojis/${
				parsedEmoji.id
			}.${parsedEmoji.animated ? "gif" : "png"}`;
		}
	}

	if (!name) {
		return await editReplyError(interaction, "administration/addemoji:MISSING_NAME");
	}

	try {
		const emoji = await interaction.guild?.emojis.create({ name, attachment });

		if (!emoji) {
			return await editReplyError(interaction, "administration/addemoji:ERROR", {
				name,
				error: await translateContext(interaction, "misc:NO_BOT_PERMS"),
			});
		}

		return await editReplySuccess(interaction, "administration/addemoji:SUCCESS", {
			emoji: emoji.toString(),
		});
	} catch (error) {
		await editReplyError(interaction, "administration/addemoji:ERROR", { name, error });
	}
};
