import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	GuildMember,
	InteractionContextType,
} from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "play",
	...getLocalizedDesc("music/play:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
	],
	contexts: [
		InteractionContextType.Guild,
	],
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

	const member = (interaction.member as GuildMember);

	if (!member.voice.channel) return editReplyError(interaction, "music/play:NO_VOICE_CHANNEL");

	const player = await client.rainlink.create({
		guildId: interaction.guildId!,
		textId: interaction.channelId,
		voiceId: member.voice.channel!.id,
		volume: 100,
		shardId: 0,
		deaf: true,
	});

	const query = interaction.options.getString("query", true);

	const res = await client.rainlink.search(query, {
		requester: interaction.user,
	});

	if (res.tracks.length <= 0) {
		return editReplyError(interaction, "music/play:NO_RESULT", {
			query,
		});
	}

	if (res.type === "PLAYLIST") for (const track of res.tracks) player.queue.add(track);
	else player.queue.add(res.tracks[0]);

	if (!player.playing) await player.play();

	editReplySuccess(
		interaction,
		`music/play:ADDED_${res.type === "PLAYLIST" ? "PLAYLIST" : "TRACK"}`,
		{
			count: res.tracks.length || 0,
			name: res.playlistName || res.tracks[0].title,
			url: res.tracks[0].uri,
		},
	);
};
