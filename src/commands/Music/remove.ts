import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { formatTrack, getControllablePlayer, updateNowPlaying } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { Track } from "lavalink-client";

export const data: CommandData = {
	name: "remove",
	...getLocalizedDesc("music/remove:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "position",
			...getLocalizedDesc("music/remove:POSITION"),
			type: ApplicationCommandOptionType.Integer,
			required: true,
			// eslint-disable-next-line camelcase
			min_value: 1,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	const position = interaction.options.getInteger("position", true);
	const track = player.queue.tracks[position - 1] as Track | undefined;
	if (!track) return editReplyError(interaction, "music/remove:NO_TRACK", { count: player.queue.tracks.length });

	await player.queue.remove(position - 1);
	await updateNowPlaying(player);

	await editReplySuccess(interaction, "music/remove:SUCCESS", { track: formatTrack(track) });
};
