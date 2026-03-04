import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { addToQueue } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	GuildMember,
	InteractionContextType,
} from "discord.js";

export const data: CommandData = {
	name: "play",
	...getLocalizedDesc("music/play:DESCRIPTION"),
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

	const member = interaction.member as GuildMember;
	if (!member.voice.channel) return editReplyError(interaction, "music/play:NO_VOICE_CHANNEL");

	const query = interaction.options.getString("query", true);

	const res = await addToQueue(interaction.guildId!, interaction.channelId, member.voice.channelId!, member, query);

	if (!res)
		return editReplyError(interaction, "music/play:NO_RESULT", {
			query,
		});

	const isPlaylist = res.loadType === "playlist";

	await editReplySuccess(interaction, `music/play:ADDED_${isPlaylist ? "PLAYLIST" : "TRACK"}`, {
		name: isPlaylist ? res.playlist?.title : res.tracks[0].info.title,
		url: isPlaylist ? query : res.tracks[0].info.uri,
		count: res.tracks.length,
	});
};
