import { editReplyError, getLocalizedDesc, randomNum, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const MAX_OPTIONS = 25;

export const data: CommandData = {
	name: "choose",
	...getLocalizedDesc("fun/choose:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "options",
			...getLocalizedDesc("fun/choose:OPTIONS"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "ephemeral",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const options = [
		...new Set(
			interaction.options
				.getString("options", true)
				.split(/[,|]/)
				.map(option => option.trim())
				.filter(Boolean),
		),
	];

	if (options.length < 2 || options.length > MAX_OPTIONS)
		return editReplyError(interaction, "fun/choose:BAD_OPTIONS", { max: MAX_OPTIONS });

	await interaction.editReply({
		content: await translateContext(interaction, "fun/choose:RESULT", {
			choice: options[randomNum(0, options.length - 1)],
		}),
		allowedMentions: { parse: [] },
	});
};
