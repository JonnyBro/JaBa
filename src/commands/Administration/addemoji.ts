import { replyError, replySuccess } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "addemoji",
	description: client.translate("administration/addemoji:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	description_localizations: {
		uk: client.translate("administration/addemoji:DESCRIPTION", { lng: "uk-UA" }),
		ru: client.translate("administration/addemoji:DESCRIPTION", { lng: "ru-RU" }),
	},
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "link",
			description: client.translate("common:LINK"),
			type: ApplicationCommandOptionType.String,
			required: true,
			// eslint-disable-next-line camelcase
			description_localizations: {
				uk: client.translate("common:LINK", { lng: "uk-UA" }),
				ru: client.translate("common:LINK", { lng: "ru-RU" }),
			},
		},
		{
			name: "name",
			description: client.translate("common:NAME"),
			type: ApplicationCommandOptionType.String,
			required: true,
			// eslint-disable-next-line camelcase
			description_localizations: {
				uk: client.translate("common:NAME", { lng: "uk-UA" }),
				ru: client.translate("common:NAME", { lng: "ru-RU" }),
			},
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ ephemeral: true });

	const link = interaction.options.getString("link") || "",
		name = interaction.options.getString("name") || "";

	interaction.guild?.emojis
		.create({
			name: name,
			attachment: link,
		})
		.then(emoji =>
			replySuccess(interaction, "administration/stealemoji:SUCCESS", {
				emoji: emoji.toString(),
			}, { edit: true }),
		)
		.catch(e => {
			replyError(interaction, "administration/stealemoji:ERROR", {
				name,
				e,
			}, { edit: true });
		});
};
