import { translateContext } from "@/helpers/functions.js";
import TicketModel from "@/models/TicketModel.js";
import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Channel,
	ChannelType,
	GuildMember,
	MessageCreateOptions,
	MessageFlags,
	PermissionsBitField,
	ThreadChannel,
	User,
} from "discord.js";

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

const STAFF_PERMISSIONS = [PermissionsBitField.Flags.ManageThreads, PermissionsBitField.Flags.ModerateMembers];

export const isTicketStaff = (member: GuildMember) => STAFF_PERMISSIONS.some(p => member.permissions.has(p));

/**
 * A private thread the bot made is a ticket. Ones from before tickets were saved have no record,
 * their author is unknown and only staff can manage them
 */
export const getTicket = async (channel: Channel | null) => {
	if (!channel || channel.type !== ChannelType.PrivateThread || channel.ownerId !== useClient().user.id) return null;

	const record = await TicketModel.findOne({ threadId: channel.id }).lean();

	return { thread: channel, authorId: record?.authorId ?? null };
};

export const canCloseTicket = (member: GuildMember, ticket: { authorId: string | null }) =>
	member.id === ticket.authorId || isTicketStaff(member);

const statusMessage = (content: string) => ({
	flags: MessageFlags.IsComponentsV2 as const,
	components: [createContainer().addTextDisplayComponents(createText(content))],
	allowedMentions: { parse: [] },
});

/** Posts the reason first, a locked and archived thread can't be written to anymore */
export const closeTicket = async (thread: ThreadChannel, closedBy: User, reason?: string | null) => {
	const key = reason ? "tickets/ticket:CLOSED_REASON" : "tickets/ticket:CLOSED";

	await thread.send(statusMessage(await translateContext(thread.guild, key, { user: closedBy.toString(), reason })));
	await TicketModel.updateOne({ threadId: thread.id }, { closedAt: new Date(), closedBy: closedBy.id });
	await thread.setLocked(true);
	await thread.setArchived(true);
};

export const reopenTicket = async (thread: ThreadChannel, reopenedBy: User) => {
	await thread.setArchived(false);
	await thread.setLocked(false);
	await TicketModel.updateOne({ threadId: thread.id }, { closedAt: null, closedBy: null });
	await thread.send(
		statusMessage(await translateContext(thread.guild, "tickets/ticket:REOPENED", { user: reopenedBy.toString() })),
	);
};
