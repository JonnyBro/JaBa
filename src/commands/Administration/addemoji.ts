import { replyError, replySuccess } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType, MessageFlags } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "addemoji",
	description: client.i18n.translate("administration/addemoji:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	description_localizations: {
		ru: client.i18n.translate("administration/addemoji:DESCRIPTION", { lng: "ru-RU" }),
		uk: client.i18n.translate("administration/addemoji:DESCRIPTION", { lng: "uk-UA" }),
	},
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "link",
			description: client.i18n.translate("common:LINK"),
			type: ApplicationCommandOptionType.String,
			required: true,
			// eslint-disable-next-line camelcase
			description_localizations: {
				ru: client.i18n.translate("common:LINK", { lng: "ru-RU" }),
				uk: client.i18n.translate("common:LINK", { lng: "uk-UA" }),
			},
		},
		{
			name: "name",
			description: client.i18n.translate("common:NAME"),
			type: ApplicationCommandOptionType.String,
			required: true,
			// eslint-disable-next-line camelcase
			description_localizations: {
				ru: client.i18n.translate("common:NAME", { lng: "ru-RU" }),
				uk: client.i18n.translate("common:NAME", { lng: "uk-UA" }),
			},
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const attachment = interaction.options.getString("link") || "";
	const name = interaction.options.getString("name") || "";

	try {
		const emoji = await interaction.guild?.emojis.create({ name, attachment });

		if (!emoji) return replyError(interaction, "administration/addemoji:ERROR", { name }, { edit: true });

		return replySuccess(interaction, "administration/addemoji:SUCCESS", { emoji: emoji.toString() }, { edit: true });
	} catch (error) {
		console.error(error, "ADDING EMOJI");
		replyError(interaction, "administration/addemoji:ERROR", { name, error }, { edit: true });
	}
};
