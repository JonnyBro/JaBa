import { getLocalizedDesc } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	GuildMember,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

export const data: CommandData = {
	name: "avatar",
	...getLocalizedDesc("general/avatar:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [
		InteractionContextType.BotDM,
		InteractionContextType.Guild,
		InteractionContextType.PrivateChannel,
	],
	options: [
		{
			name: "user",
			type: ApplicationCommandOptionType.User,
			...getLocalizedDesc("common:USER"),
		},
		{
			name: "server",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("general/avatar:SERVER"),
		},
		{
			name: "ephemeral",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const user = interaction.guild
		? (interaction.options.getMember("user") as GuildMember) || interaction.member!
		: interaction.options.getUser("user") || interaction.user!;
	const avatarURL =
		interaction.options.getBoolean("server") && interaction.guild
			? user.displayAvatarURL({ forceStatic: false, extension: "png", size: 2048 })
			: user.avatarURL({ forceStatic: false, extension: "png", size: 2048 });
	const embed = createEmbed().setImage(avatarURL);

	interaction.editReply({
		embeds: [embed],
	});
};
