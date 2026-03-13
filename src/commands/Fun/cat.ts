import { getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

export const data: CommandData = {
	name: "cat",
	...getLocalizedDesc("fun/cat:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
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

	const res = (await fetch("https://api.thecatapi.com/v1/images/search").then(r => r.json()))[0];
	if (!res) return interaction.editReply("error in the api");

	const embed = createEmbed({
		image: {
			url: res.url,
			height: res.height,
			width: res.width,
		},
	});

	await interaction.editReply({ embeds: [embed] });
};
