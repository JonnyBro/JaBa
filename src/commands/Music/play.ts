import { getLocalizedDesc } from "@/helpers/functions.js";
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
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [
		InteractionContextType.BotDM,
		InteractionContextType.Guild,
		InteractionContextType.PrivateChannel,
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

	const query = interaction.options.getString("query", true);

	if (!(interaction.member as GuildMember).voice.channel) return interaction.editReply("no vc");

	const player = await client.rainlink.create({
		guildId: interaction.guildId!,
		textId: interaction.channelId,
		voiceId: (interaction.member as GuildMember).voice.channel!.id,
		volume: 100,
		shardId: 0,
	});

	const res = await client.rainlink.search("yt:" + query, { requester: interaction.user });
	if (!res.tracks.length) return interaction.editReply("No results found!");

	if (res.type === "PLAYLIST") for (const track of res.tracks) player.queue.add(track);
	else player.queue.add(res.tracks[0]);

	if (!player.playing || !player.paused) await player.play();

	interaction.editReply(
		res.type === "PLAYLIST"
			? `Queued ${res.tracks.length} from ${res.playlistName}`
			: `Queued ${res.tracks[0].title}`,
	);
};
