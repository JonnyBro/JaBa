import { editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { buildTicketPanel } from "@/helpers/tickets.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

export const data: CommandData = {
	name: "ticketsembed",
	...getLocalizedDesc("tickets/ticketsembed:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "text",
			...getLocalizedDesc("tickets/ticketsembed:TEXT"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "label",
			...getLocalizedDesc("tickets/ticketsembed:LABEL"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "emoji",
			...getLocalizedDesc("tickets/ticketsembed:EMOJI"),
			type: ApplicationCommandOptionType.String,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const text = interaction.options.getString("text", true);
	const label = interaction.options.getString("label", true);
	const emoji = interaction.options.getString("emoji");

	if (interaction.channel?.isSendable()) await interaction.channel.send(buildTicketPanel(text, label, emoji));

	await editReplySuccess(interaction, "tickets/ticketsembed:SUCCESS");
};
