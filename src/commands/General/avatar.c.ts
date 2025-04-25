import { ContextCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import { ApplicationCommandType, ApplicationIntegrationType, ContextMenuCommandBuilder, InteractionContextType } from "discord.js";

export const data = new ContextMenuCommandBuilder()
	.setName("Get Avatar")
	.setType(ApplicationCommandType.User)
	.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
	.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild]);

export const run = async ({ interaction }: ContextCommandProps) => {
	const avatarURL = interaction.guild ? interaction.user.displayAvatarURL({ forceStatic: false, extension: "png", size: 2048 }) : interaction.user.avatarURL({ forceStatic: false, extension: "png", size: 2048 });
	const embed = createEmbed({}).setImage(avatarURL);

	interaction.reply({
		embeds: [embed],
	});
};
