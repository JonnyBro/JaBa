import { getLocalizedDesc } from "@/helpers/functions.js";
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
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "user",
			type: ApplicationCommandOptionType.Subcommand,
			...getLocalizedDesc("general/avatar:USER"),
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
		},
		{
			name: "server",
			type: ApplicationCommandOptionType.Subcommand,
			...getLocalizedDesc("general/avatar:SERVER"),
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
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const subcommand = interaction.options.getSubcommand();
	const embed = createEmbed();

	switch (subcommand) {
		case "user": {
			const user = interaction.options.getUser("user") || interaction.user;
			const avatar = user.avatarURL({ forceStatic: false, extension: "png", size: 2048 });

			embed.setImage(avatar);

			break;
		}

		case "server": {
			const member = (interaction.options.getMember("user") as GuildMember) || interaction.member;
			const avatar = member.displayAvatarURL({
				forceStatic: false,
				extension: "png",
				size: 2048,
			});

			embed.setImage(avatar);

			break;
		}
	}

	interaction.editReply({
		embeds: [embed],
	});
};
