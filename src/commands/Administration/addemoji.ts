import { getLocalizedDesc, replyError, replySuccess } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType, MessageFlags } from "discord.js";

export const data: CommandData = {
	name: "addemoji",
	...getLocalizedDesc("administration/addemoji:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "link",
			...getLocalizedDesc("common:LINK"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "name",
			...getLocalizedDesc("common:NAME"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const attachment = interaction.options.getString("link", true);
	const name = interaction.options.getString("name", true);

	try {
		const emoji = await interaction.guild?.emojis.create({ name, attachment });
		if (!emoji) return replyError(interaction, "administration/addemoji:ERROR", { name }, { edit: true });

		return replySuccess(interaction, "administration/addemoji:SUCCESS", { emoji: emoji.toString() }, { edit: true });
	} catch (error) {
		console.error(error, "ADDING EMOJI");
		replyError(interaction, "administration/addemoji:ERROR", { name, error }, { edit: true });
	}
};
