import { editReplyError, getLocalizedDesc } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType, MessageFlags } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "shorturl",
	...getLocalizedDesc("general/shorturl:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
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
			required: false,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	return interaction.reply("Doesn't work right now, waiting for API to update.");

	// eslint-disable-next-line no-unreachable
	await interaction.deferReply({ flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined });

	const url = interaction.options.getString("url", true);
	if (!url.startsWith("http")) return editReplyError(interaction, "general/shorturl:NOT_A_LINK", null);

	const res = await fetch("https://i.jonnybro.ru/api/shorten", { // old v3 API, waiting for v4 API
		method: "POST",
		headers: {
			"Authorization": client.configService.get("apiKeys.zipline"),
			"Max-Views": "0",
		},
		body: JSON.stringify({ url: url }),
	}).then(res => res.json());

	interaction.editReply({
		content: `<${res.url}>`,
	});
};
