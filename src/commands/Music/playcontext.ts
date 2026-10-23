import { editReplyError, editReplySuccess } from "@/helpers/functions.js";
import { addToQueue, checkVoice } from "@/helpers/music.js";
import { MessageContextCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	ContextMenuCommandBuilder,
	GuildMember,
	InteractionContextType,
} from "discord.js";

const client = useClient();

const LINK_REGEXP = /https?:\/\/[^\s<>`"'|*()[\]]+/;
const TRAILING_PUNCTUATION = /[.,;:!?~_]+$/;

export const data = new ContextMenuCommandBuilder()
	.setName(client.i18n.translate("music/play:CONTEXT_NAME", { lng: "en-US" }))
	.setNameLocalizations({
		ru: client.i18n.translate("music/play:CONTEXT_NAME", { lng: "ru-RU" }),
	})
	.setType(ApplicationCommandType.Message)
	.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
	.setContexts([InteractionContextType.Guild]);

export const run = async ({ interaction }: MessageContextCommandProps) => {
	await interaction.deferReply();

	const query = interaction.targetMessage.content.match(LINK_REGEXP)?.[0].replace(TRAILING_PUNCTUATION, "");
	if (!query) return editReplyError(interaction, "music/play:NO_LINK");

	const member = interaction.member as GuildMember;
	const player = client.lavalink.getPlayer(interaction.guildId!);

	const voiceError = checkVoice(member, player?.queue.current ? player : undefined);
	if (voiceError) return editReplyError(interaction, voiceError);

	const { res, error, exception } = await addToQueue({
		guildId: interaction.guildId!,
		textChannelId: interaction.channelId,
		voiceChannelId: member.voice.channelId!,
		requester: interaction.user,
		query,
	});

	if (!res) return editReplyError(interaction, error, { query, error: exception?.message });

	const isPlaylist = res.loadType === "playlist";

	await editReplySuccess(interaction, `music/play:ADDED_${isPlaylist ? "PLAYLIST" : "TRACK"}`, {
		name: isPlaylist ? res.playlist?.title : res.tracks[0].info.title,
		url: isPlaylist ? query : res.tracks[0].info.uri,
		count: res.tracks.length,
	});
};
