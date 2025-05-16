import {
	editReplyError,
	getLocalizedDesc,
	replyError,
	translateContext,
} from "@/helpers/functions.js";
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
	name: "shorturl",
	...getLocalizedDesc("general/shorturl:DESCRIPTION"),
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
			name: "url",
			...getLocalizedDesc("common:URL"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "ephemeral",
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
			type: ApplicationCommandOptionType.Boolean,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	if (
		!client.configService.get("apiKeys.urlShortener.url") ||
		!client.configService.get("apiKeys.urlShortener.key")
	) {
		return replyError(interaction, "API URL or key not set!");
	}

	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const url = interaction.options.getString("url", true);
	if (!url.startsWith("http")) {
		return editReplyError(interaction, "general/shorturl:NOT_A_LINK", null);
	}

	const res = await fetch(client.configService.get("apiKeys.urlShortener.url"), {
		method: "POST",
		headers: {
			Authorization: client.configService.get("apiKeys.urlShortener.key"),
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ destination: url }),
	}).then(res => res.json());

	const embed = createEmbed({
		fields: [
			{
				name: await translateContext(interaction, "common:DESTINATION"),
				value: res.destination,
			},
			{
				name: await translateContext(interaction, "common:URL"),
				value: res.url,
			},
		],
	});

	interaction.editReply({
		embeds: [embed],
	});
};
