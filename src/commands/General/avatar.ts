import { buildAvatarPanel } from "@/helpers/avatar.js";
import { getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
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
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "user",
			type: ApplicationCommandOptionType.User,
			...getLocalizedDesc("common:USER"),
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

	const user = interaction.options.getUser("user") || interaction.user;

	// Without the bot in the guild (user install) members come as raw API objects
	const member = interaction.options.getMember("user") || (user === interaction.user ? interaction.member : null);

	await interaction.editReply(
		await buildAvatarPanel(interaction, user, member instanceof GuildMember ? member : null),
	);
};
