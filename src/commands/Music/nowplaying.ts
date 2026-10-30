import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { savePlayerState } from "@/helpers/music-resume.js";
import { sendNowPlaying } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "nowplaying",
	...getLocalizedDesc("music/nowplaying:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const player = client.lavalink.getPlayer(interaction.guildId!);
	if (!player?.queue.current) return editReplyError(interaction, "music/play:NOT_PLAYING");

	// The player follows to this channel, so the next tracks are announced here too
	player.textChannelId = interaction.channelId;
	const message = await sendNowPlaying(player, player.queue.current);
	if (!message) return editReplyError(interaction, "misc:NO_BOT_PERMS");

	await savePlayerState(player, message.id);

	await editReplySuccess(interaction, "music/nowplaying:SUCCESS");
};
