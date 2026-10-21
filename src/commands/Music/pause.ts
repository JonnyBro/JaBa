import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { getControllablePlayer, updateNowPlaying } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

export const data: CommandData = {
	name: "pause",
	...getLocalizedDesc("music/pause:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	if (player.paused) await player.resume();
	else await player.pause();

	await updateNowPlaying(player);

	await editReplySuccess(interaction, player.paused ? "music/pause:PAUSED" : "music/pause:RESUMED");
};
