import { editReplyError, getLocalizedDesc } from "@/helpers/functions.js";
import {
	DEFAULT_FIELDS,
	gameAutocomplete,
	getDefaultPort,
	getGame,
	parseAddress,
	QueryError,
	queryServer,
	renderStatus,
	toStatusMessage,
} from "@/helpers/game-servers.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

export const data: CommandData = {
	name: "gamestatus",
	...getLocalizedDesc("general/gamestatus:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "game",
			...getLocalizedDesc("gameservers:GAME_OPTION"),
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
		{
			name: "address",
			...getLocalizedDesc("gameservers:ADDRESS_OPTION"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const game = interaction.options.getString("game", true);
	if (!getGame(game)) return editReplyError(interaction, "gameservers:ERRORS:UNKNOWN_GAME");

	const address = parseAddress(interaction.options.getString("address", true));
	if (!address) return editReplyError(interaction, "gameservers:ERRORS:ADDRESS");

	const port = address.port ?? getDefaultPort(game);
	if (!port) return editReplyError(interaction, "gameservers:ERRORS:PORT");

	const target = { game, host: address.host, port };
	const state = await queryServer(target).catch((error: unknown) =>
		error instanceof QueryError ? error.reason : "NO_RESPONSE",
	);
	if (typeof state === "string") return editReplyError(interaction, `gameservers:ERRORS:${state}`);

	const rendered = await renderStatus(
		interaction.guild!,
		{
			...target,
			title: null,
			fields: DEFAULT_FIELDS,
			connectButton: true,
			state,
			online: true,
			lastOnline: new Date(),
		},
		false,
	);

	await interaction.editReply(toStatusMessage(rendered));
};

export const autocompleteRun = async ({ interaction }: AutocompleteProps) =>
	interaction.respond(gameAutocomplete(interaction.options.getFocused()));
