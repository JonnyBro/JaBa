import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
} from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "volume",
	...getLocalizedDesc("music/volume:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "volume",
			...getLocalizedDesc("common:INT"),
			type: ApplicationCommandOptionType.Integer,
			required: true,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const player = client.rainlink.players.get(interaction.guildId!);
	if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");

	const volume = Math.max(Math.min(interaction.options.getInteger("volume", true), 200), 1);

	await player.setVolume(volume);

	editReplySuccess(interaction, "music/stop:SUCCESS");
};
