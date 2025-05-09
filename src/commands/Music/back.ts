import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "back",
	...getLocalizedDesc("music/back:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const player = client.rainlink.players.get(interaction.guildId!);
	if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");
	if (!player.queue.previous) return editReplyError(interaction, "music/back:NO_PREV_SONG");

	await player.previous();

	editReplySuccess(interaction, "music/back:SUCCESS");
};
