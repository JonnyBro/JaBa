import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
} from "discord.js";

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

	const player = client.rainlink.players.get(interaction.guildId!);
	if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");

	const query = interaction.options.getString("query", true);

	const res = await client.rainlink.search(query, {
		requester: interaction.user,
	});

	if (res.tracks.length <= 0) {
		return editReplyError(interaction, "music/play:NO_RESULT", {
			query,
		});
	}

	const isPlaylist = res.type === "PLAYLIST";

	player.queue.splice(0, 0, ...res.tracks);

	await editReplySuccess(interaction, `music/play:ADDED_${isPlaylist ? "PLAYLIST" : "TRACK"}`, {
		count: res.tracks.length,
		name: res.playlistName || res.tracks[0].title,
		url: isPlaylist ? query : res.tracks[0].uri,
	});
};
