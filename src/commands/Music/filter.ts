import {
	editReplyError,
	editReplySuccess,
	getLocalizations,
	getLocalizedDesc,
	translateContext,
} from "@/helpers/functions.js";
import {
	FILTERS,
	FilterName,
	formatFilters,
	getControllablePlayer,
	toggleFilter,
	updateNowPlaying,
} from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "filter",
	...getLocalizedDesc("music/filter:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "name",
			...getLocalizedDesc("music/filter:NAME"),
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [...FILTERS, "reset" as const].map(name => ({
				name: client.i18n.translate(`music/filter:FILTERS:${name}`),
				// eslint-disable-next-line camelcase
				name_localizations: getLocalizations(`music/filter:FILTERS:${name}`),
				value: name,
			})),
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = await getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	await toggleFilter(player, interaction.options.getString("name", true) as FilterName | "reset");
	await updateNowPlaying(player);

	const filters = await formatFilters(player, (key, args) => translateContext(interaction, key, args));
	if (!filters) return editReplySuccess(interaction, "music/filter:NONE");

	await editReplySuccess(interaction, "music/filter:ACTIVE", { filters });
};
