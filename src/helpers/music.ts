import useClient from "@/utils/use-client.js";
import { ChatInputCommandInteraction, GuildMember, MessageContextMenuCommandInteraction } from "discord.js";
import { editReplyError, editReplySuccess } from "./functions.js";

const client = useClient();

export const playQuery = async (
	interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction,
	member: GuildMember,
	query: string,
) => {
	const player =
		client.lavalink.getPlayer(interaction.guildId!) ||
		client.lavalink.createPlayer({
			guildId: interaction.guildId!,
			textChannelId: interaction.channelId,
			voiceChannelId: member.voice.channel!.id,
			volume: 100,
			selfDeaf: true,
		});

	const res = await player.search(query, interaction.member);

	if (!res || !res.tracks.length)
		return editReplyError(interaction, "music/play:NO_RESULT", {
			query,
		});

	const isPlaylist = res.loadType === "playlist";

	if (isPlaylist) for (const track of res.tracks) player.queue.add(track);
	else player.queue.add(res.tracks[0]);

	if (!player.connected) await player.connect();
	if (!player.playing) await player.play();

	await editReplySuccess(interaction, `music/play:ADDED_${isPlaylist ? "PLAYLIST" : "TRACK"}`, {
		name: res.playlist?.title || res.tracks[0].info.title,
		url: res.playlist?.uri || res.tracks[0].info.uri,
		count: res.tracks.length,
	});
};
