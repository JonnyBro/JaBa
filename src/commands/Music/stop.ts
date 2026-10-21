import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { getControllablePlayer } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

export const data: CommandData = {
	name: "stop",
	...getLocalizedDesc("music/stop:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	await player.destroy("stopped by user", true);

	await editReplySuccess(interaction, "music/stop:SUCCESS");
};
