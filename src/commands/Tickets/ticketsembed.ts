import { editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
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

	const button = new ButtonBuilder().setCustomId("tickets_create").setLabel(label).setStyle(ButtonStyle.Success);

	if (emoji) button.setEmoji(emoji.trim());

	const container = createContainer()
		.addTextDisplayComponents(createText(text))
		.addSeparatorComponents(createSeparator(false))
		.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(button))
		.addTextDisplayComponents(createFooter());

	// Unlike embeds, mentions inside text displays do ping
	if (interaction.channel?.isSendable())
		await interaction.channel.send({
			flags: MessageFlags.IsComponentsV2,
			components: [container],
			allowedMentions: { parse: [] },
		});

	await editReplySuccess(interaction, "tickets/ticketsembed:SUCCESS");
};
