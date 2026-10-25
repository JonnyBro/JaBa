import { editReplyError, editReplySuccess, getLocalizedDesc, shortenString } from "@/helpers/functions.js";
import { checkVoice } from "@/helpers/music.js";
import { findPlaylist, playPlaylist } from "@/helpers/playlists.js";
import PlaylistModel from "@/models/PlaylistModel.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	GuildMember,
	InteractionContextType,
} from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "playlist",
	...getLocalizedDesc("music/playlist:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "name",
			...getLocalizedDesc("music/playlist:NAME"),
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
		{
			name: "shuffle",
			...getLocalizedDesc("music/playlist:SHUFFLE"),
			type: ApplicationCommandOptionType.Boolean,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const member = interaction.member as GuildMember;
	const player = client.lavalink.getPlayer(interaction.guildId!);

	const voiceError = checkVoice(member, player?.queue.current ? player : undefined);
	if (voiceError) return editReplyError(interaction, voiceError);

	const name = interaction.options.getString("name", true);
	const playlist = await findPlaylist(interaction.user.id, name);
	if (!playlist) return editReplyError(interaction, "music/playlist:NOT_FOUND", { name });
	if (!playlist.tracks.length) return editReplyError(interaction, "music/playlist:EMPTY");

	const error = await playPlaylist({
		playlist,
		guildId: interaction.guildId!,
		textChannelId: interaction.channelId,
		voiceChannelId: member.voice.channelId!,
		requester: interaction.user,
		shuffle: interaction.options.getBoolean("shuffle") || false,
	});

	if (error) return editReplyError(interaction, error);

	await editReplySuccess(interaction, "music/playlist:ADDED", { name: playlist.name, count: playlist.tracks.length });
};

export const autocompleteRun = async ({ interaction }: AutocompleteProps) => {
	const query = interaction.options.getFocused().trim().toLowerCase();
	const playlists = await PlaylistModel.find({ userId: interaction.user.id }, { name: 1, tracks: 1 }).lean();

	// The id is the value, so names that differ only in case or have odd characters still work
	await interaction
		.respond(
			playlists
				.filter(p => p.name.toLowerCase().includes(query))
				.slice(0, 25)
				.map(p => ({
					name: shortenString(`${p.name} (${p.tracks.length})`, 100),
					value: p._id.toString(),
				})),
		)
		.catch(() => {});
};
