import { convertTime, editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { getControllablePlayer } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

export const data: CommandData = {
	name: "seek",
	...getLocalizedDesc("music/seek:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "time",
			...getLocalizedDesc("music/seek:TIME"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
};

const parseTime = (input: string) => {
	const parts = input.trim().split(":").map(Number);
	if (!parts.length || parts.length > 3 || parts.some(n => !Number.isInteger(n) || n < 0)) return null;

	return parts.reduce((acc, n) => acc * 60 + n, 0) * 1000;
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	const track = player.queue.current!;
	if (track.info.isStream || !track.info.isSeekable) return editReplyError(interaction, "music/seek:NOT_SEEKABLE");

	const position = parseTime(interaction.options.getString("time", true));
	if (position === null) return editReplyError(interaction, "music/seek:INVALID_TIME");
	if (position >= track.info.duration)
		return editReplyError(interaction, "music/seek:TOO_FAR", { duration: convertTime(track.info.duration) });

	await player.seek(position);

	await editReplySuccess(interaction, "music/seek:SUCCESS", { time: convertTime(position) });
};
