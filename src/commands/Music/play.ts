import { editReplyError, getLocalizedDesc } from "@/helpers/functions.js";
import { playQuery } from "@/helpers/musicFunctions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	GuildMember,
	InteractionContextType,
} from "discord.js";

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
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const member = interaction.member as GuildMember;
	if (!member.voice.channel) return editReplyError(interaction, "music/play:NO_VOICE_CHANNEL");

	const query = interaction.options.getString("query", true);

	await playQuery(interaction, member, query);
};
