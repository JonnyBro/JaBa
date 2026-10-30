import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { formatTrack, getControllablePlayer, updateNowPlaying } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { Track } from "lavalink-client";

export const data: CommandData = {
	name: "move",
	...getLocalizedDesc("music/move:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "from",
			...getLocalizedDesc("music/move:FROM"),
			type: ApplicationCommandOptionType.Integer,
			required: true,
			// eslint-disable-next-line camelcase
			min_value: 1,
		},
		{
			name: "to",
			...getLocalizedDesc("music/move:TO"),
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

	const { length } = player.queue.tracks;
	const from = interaction.options.getInteger("from", true);
	const to = Math.min(interaction.options.getInteger("to", true), length);
	if (from > length) return editReplyError(interaction, "music/remove:NO_TRACK", { count: length });

	const [track] = (await player.queue.splice(from - 1, 1)) as Track[];
	await player.queue.splice(to - 1, 0, track);
	await updateNowPlaying(player);

	await editReplySuccess(interaction, "music/move:SUCCESS", { track: formatTrack(track), position: to });
};
