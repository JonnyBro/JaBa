import { editReplyError, editReplySuccess, getLocalizedDesc, shortenString } from "@/helpers/functions.js";
import { addToQueue, checkVoice, SEARCH_SOURCES, SearchSource } from "@/helpers/music.js";
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
			autocomplete: true,
		},
		{
			name: "source",
			...getLocalizedDesc("music/play:SOURCE"),
			type: ApplicationCommandOptionType.String,
			choices: Object.keys(SEARCH_SOURCES).map(source => ({
				name: client.i18n.translate(`music/play:SOURCES:${source}`),
				// eslint-disable-next-line camelcase
				name_localizations: { ru: client.i18n.translate(`music/play:SOURCES:${source}`, { lng: "ru-RU" }) },
				value: source,
			})),
		},
		{
			name: "next",
			...getLocalizedDesc("music/play:NEXT"),
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

	const query = interaction.options.getString("query", true);
	const next = interaction.options.getBoolean("next") || false;

	const { res, error, exception } = await addToQueue({
		guildId: interaction.guildId!,
		textChannelId: interaction.channelId,
		voiceChannelId: member.voice.channelId!,
		requester: interaction.user,
		query,
		source: (interaction.options.getString("source") as SearchSource | null) || undefined,
		next,
	});

	if (!res) return editReplyError(interaction, error, { query, error: exception?.message });

	const isPlaylist = res.loadType === "playlist";

	await editReplySuccess(interaction, `music/play:${next ? "NEXT_" : "ADDED_"}${isPlaylist ? "PLAYLIST" : "TRACK"}`, {
		name: isPlaylist ? res.playlist?.title : res.tracks[0].info.title,
		url: isPlaylist ? query : res.tracks[0].info.uri,
		count: res.tracks.length,
	});
};

export const autocompleteRun = async ({ interaction }: AutocompleteProps) => {
	const query = interaction.options.getFocused().trim();
	const node = client.lavalink.nodeManager.leastUsedNodes("playingPlayers")[0];

	// Links and short queries are passed as is
	if (!node || query.length < 3 || /^https?:\/\//.test(query)) return interaction.respond([]);

	const source = interaction.options.getString("source") as SearchSource | null;

	try {
		const res = await node.search({ query, source: SEARCH_SOURCES[source || "ytm"] }, interaction.user);

		await interaction.respond(
			res.tracks
				.filter(track => track.info.uri && track.info.uri.length <= 100)
				.slice(0, 10)
				.map(track => ({
					name: shortenString(`${track.info.title} — ${track.info.author.replace(/ - Topic$/, "")}`, 100),
					value: track.info.uri!,
				})),
		);
	} catch {
		await interaction.respond([]).catch(() => {});
	}
};
