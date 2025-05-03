import { getLocalizedDesc } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "lmgtfy",
	...getLocalizedDesc("fun/lmgtfy:DESCRIPTION"),
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
			name: "query",
			type: ApplicationCommandOptionType.String,
			...getLocalizedDesc("fun/lmgtfy:QUERY"),
			required: true,
		},
		{
			name: "short",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("fun/lmgtfy:SHORT"),
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

	const query = interaction.options.getString("query", true).replace(/\s+/g, "+");
	const short = interaction.options.getBoolean("short");
	const url = `https://letmegooglethat.com/?q=${encodeURIComponent(query)}`;
	const embed = createEmbed({
		description: url,
	});

	if (short) {
		const res = await fetch(client.configService.get("apiKeys.urlShortener.url"), {
			method: "POST",
			headers: {
				Authorization: client.configService.get("apiKeys.urlShortener.key"),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ destination: url }),
		}).then(res => res.json());

		embed.setDescription(res.url);

		interaction.editReply({
			embeds: [embed],
		});
	} else {
		interaction.editReply({
			embeds: [embed],
		});
	}
};
