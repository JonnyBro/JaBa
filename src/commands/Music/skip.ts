import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { getControllablePlayer, isAutoplayEnabled } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

export const data: CommandData = {
	name: "skip",
	...getLocalizedDesc("music/skip:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	if (!player.queue.tracks.length && !isAutoplayEnabled(player))
		return editReplyError(interaction, "music/queue:NO_QUEUE");

	if (player.queue.tracks.length) await player.skip();
	else await player.stopPlaying(false, true);

	await editReplySuccess(interaction, "music/skip:SUCCESS");
};
