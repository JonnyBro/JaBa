import { editReplyError } from "@/helpers/functions.js";
import { playQuery } from "@/helpers/musicFunctions.js";
import { MessageContextCommandProps } from "@/types.js";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	ContextMenuCommandBuilder,
	GuildMember,
	InteractionContextType,
} from "discord.js";

export const data = new ContextMenuCommandBuilder()
	.setName("Add to Queue")
	.setType(ApplicationCommandType.Message)
	.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
	.setContexts([InteractionContextType.Guild]);

export const run = async ({ interaction }: MessageContextCommandProps) => {
	await interaction.deferReply();

	const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;
	const links = interaction.targetMessage.content.match(regex);
	if (!links) return editReplyError(interaction, "music/play:NO_LINK");

	const member = interaction.member as GuildMember;
	if (!member.voice.channel) return editReplyError(interaction, "music/play:NO_VOICE_CHANNEL");

	const query = links[0];

	await playQuery(interaction, member, query);
};
