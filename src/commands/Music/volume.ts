import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { getControllablePlayer, MAX_VOLUME, updateNowPlaying } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

export const data: CommandData = {
	name: "volume",
	...getLocalizedDesc("music/volume:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "volume",
			...getLocalizedDesc("music/volume:VOLUME"),
			type: ApplicationCommandOptionType.Integer,
			required: true,
			// eslint-disable-next-line camelcase
			min_value: 0,
			// eslint-disable-next-line camelcase
			max_value: MAX_VOLUME,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	const volume = interaction.options.getInteger("volume", true);

	await player.setVolume(volume);
	await updateNowPlaying(player);

	await editReplySuccess(interaction, "music/volume:SUCCESS", { volume });
};
