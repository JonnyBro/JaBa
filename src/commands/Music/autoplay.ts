import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { getControllablePlayer, isAutoplayEnabled, setAutoplay, updateNowPlaying } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

export const data: CommandData = {
	name: "autoplay",
	...getLocalizedDesc("music/autoplay:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	setAutoplay(player, !isAutoplayEnabled(player));

	await updateNowPlaying(player);

	await editReplySuccess(
		interaction,
		isAutoplayEnabled(player) ? "music/autoplay:ENABLED" : "music/autoplay:DISABLED",
	);
};
