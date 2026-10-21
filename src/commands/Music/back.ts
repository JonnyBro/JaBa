import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { getControllablePlayer } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

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

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	const previous = player.queue.previous[0];
	if (!previous) return editReplyError(interaction, "music/back:NO_PREV_SONG");

	await player.queue.previous.shift();
	await player.play({ clientTrack: previous });

	await editReplySuccess(interaction, "music/back:SUCCESS");
};
