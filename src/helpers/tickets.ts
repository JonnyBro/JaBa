import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions, MessageFlags } from "discord.js";

export const TICKET_CREATE_ID = "tickets_create";

export const buildTicketPanel = (text: string, label: string, emoji?: string | null): MessageCreateOptions => {
	const button = new ButtonBuilder().setCustomId(TICKET_CREATE_ID).setLabel(label).setStyle(ButtonStyle.Success);

	if (emoji?.trim()) button.setEmoji(emoji.trim());

	const container = createContainer()
		.addTextDisplayComponents(createText(text))
		.addSeparatorComponents(createSeparator(false))
		.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(button))
		.addTextDisplayComponents(createFooter());

	// Unlike embeds, mentions inside text displays do ping
	return {
		flags: MessageFlags.IsComponentsV2,
		components: [container],
		allowedMentions: { parse: [] },
	};
};
