import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { getControllablePlayer, updateNowPlaying } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

export const data: CommandData = {
	name: "clear",
	...getLocalizedDesc("music/clear:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	const count = player.queue.tracks.length;
	if (!count) return editReplyError(interaction, "music/queue:NO_QUEUE");

	await player.queue.splice(0, count);
	await updateNowPlaying(player);

	await editReplySuccess(interaction, "music/clear:SUCCESS", { count });
};
