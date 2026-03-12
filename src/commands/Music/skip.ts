import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { doAutoplay } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "skip",
	...getLocalizedDesc("music/skip:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const player = client.lavalink.getPlayer(interaction.guildId!);
	if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");

	const isAutoPlay = (await client.getGuildData(interaction.guildId!)).plugins.music.autoPlay;

	if (!player.queue.tracks.length && !isAutoPlay) return editReplyError(interaction, "music/queue:NO_QUEUE");

	if (!player.queue.tracks.length && isAutoPlay) {
		const res = await doAutoplay(player);

		if (!res) return editReplyError(interaction, "music/queue:NO_QUEUE");
	}

	await player.skip();

	await editReplySuccess(interaction, "music/skip:SUCCESS");
};
