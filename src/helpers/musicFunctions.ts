import useClient from "@/utils/use-client.js";
import {
	ChatInputCommandInteraction,
	GuildMember,
	MessageContextMenuCommandInteraction,
} from "discord.js";
import { editReplyError, editReplySuccess } from "./functions.js";

const client = useClient();

export const playQuery = async (
	interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction,
	member: GuildMember,
	query: string,
) => {
	const res = await client.rainlink.search(query, {
		requester: interaction.user,
	});

	if (res.tracks.length <= 0) {
		return editReplyError(interaction, "music/play:NO_RESULT", {
			query,
		});
	}

	const player = await client.rainlink.create({
		guildId: interaction.guildId!,
		textId: interaction.channelId,
		voiceId: member.voice.channel!.id,
		volume: 100,
		shardId: 0,
		deaf: true,
	});

	const isPlaylist = res.type === "PLAYLIST";

	if (isPlaylist) for (const track of res.tracks) player.queue.add(track);
	else player.queue.add(res.tracks[0]);

	if (!player.playing) await player.play();

	await editReplySuccess(interaction, `music/play:ADDED_${isPlaylist ? "PLAYLIST" : "TRACK"}`, {
		name: res.playlistName || res.tracks[0].title,
		url: isPlaylist ? query : res.tracks[0].uri,
		count: res.tracks.length,
	});
};
