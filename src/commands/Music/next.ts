import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "next",
	...getLocalizedDesc("music/next:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "query",
			...getLocalizedDesc("music/play:QUERY"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const player = client.lavalink.getPlayer(interaction.guildId!);
	if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");

	const query = interaction.options.getString("query", true);

	const res = await player.search(query, interaction.user);

	if (!res || !res.tracks.length)
		return editReplyError(interaction, "music/play:NO_RESULT", {
			query,
		});

	player.queue.splice(0, 0, ...res.tracks);

	await editReplySuccess(interaction, `music/play:ADDED_${res.loadType === "playlist" ? "PLAYLIST" : "TRACK"}`, {
		name: res.playlist?.title || res.tracks[0].info.title,
		url: res.playlist?.uri || res.tracks[0].info.uri,
		count: res.tracks.length,
	});
};
