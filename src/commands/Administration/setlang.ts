import { getLocalizedDesc, translateContext } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType, MessageFlags } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "setlang",
	...getLocalizedDesc("administration/setlang:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "language",
			...getLocalizedDesc("common:LANGUAGE"),
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: "English", value: "en-US" },
				{ name: "Русский", value: "ru-RU" },
				{ name: "Українська", value: "uk-UA" },
			],
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const guildData = await client.getGuildData(interaction.guildId!);
	const lang = interaction.options.getString("language", true);
	const language = client.i18n.getSupportedLanguages.find(l => l === lang)!;

	guildData.language = language;

	await guildData.save();

	return interaction.editReply({
		content: await translateContext(interaction, "administration/setlang:SUCCESS", {
			lang: language,
		}),
	});
};
