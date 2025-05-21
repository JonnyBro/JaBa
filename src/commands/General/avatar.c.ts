import { replyError } from "@/helpers/functions.js";
import { UserContextCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	ContextMenuCommandBuilder,
	GuildMember,
	InteractionContextType,
} from "discord.js";

export const data = new ContextMenuCommandBuilder()
	.setName("Get Avatar")
	.setType(ApplicationCommandType.User)
	.setIntegrationTypes([
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	])
	.setContexts([
		InteractionContextType.BotDM,
		InteractionContextType.PrivateChannel,
		InteractionContextType.Guild,
	]);

export const run = async ({ interaction }: UserContextCommandProps) => {
	const isGuild = interaction.guild;
	const target = isGuild
		? (interaction.targetMember as GuildMember)
		: interaction.targetUser;
	if (!target) return replyError(interaction, "misc:USER_NOT_FOUND");

	const avatarURL = isGuild
		? target.displayAvatarURL({ forceStatic: false, size: 2048 })
		: target.avatarURL({ forceStatic: false, size: 2048 });
	const embed = createEmbed().setImage(avatarURL);

	interaction.reply({
		embeds: [embed],
	});
};
