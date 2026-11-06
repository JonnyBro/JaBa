import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { buildTranscript } from "@/helpers/ticket-transcript.js";
import TicketModel from "@/models/TicketModel.js";
import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	Channel,
	ChannelType,
	FileBuilder,
	Guild,
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

export const getTicketSettings = async (guildId: string) => (await useClient().getGuildData(guildId)).plugins.tickets;

export const isTicketStaff = async (member: GuildMember) =>
	STAFF_PERMISSIONS.some(p => member.permissions.has(p)) ||
	(await getTicketSettings(member.guild.id)).supportRoles.some(id => member.roles.cache.has(id));

/**
 * A private thread the bot made is a ticket. Ones from before tickets were saved have no record,
 * their author is unknown and only staff can manage them
 */
export const getTicket = async (channel: Channel | null) => {
	if (!channel || channel.type !== ChannelType.PrivateThread || channel.ownerId !== useClient().user.id) return null;

	const record = await TicketModel.findOne({ threadId: channel.id }).lean();

	return { thread: channel, authorId: record?.authorId ?? null };
};

export const canCloseTicket = async (member: GuildMember, ticket: { authorId: string | null }) =>
	member.id === ticket.authorId || (await isTicketStaff(member));

/** Components V2 messages hide attachments that no File component points at */
const statusMessage = (content: string, files: AttachmentBuilder[] = []) => {
	const container = createContainer().addTextDisplayComponents(createText(content));

	for (const file of files) container.addFileComponents(new FileBuilder().setURL(`attachment://${file.name}`));

	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [container],
		allowedMentions: { parse: [] },
		files,
	};
};

export const postTicketLog = async (guild: Guild, content: string, files: AttachmentBuilder[] = []) => {
	const { logChannel } = await getTicketSettings(guild.id);
	if (!logChannel) return;

	const channel = await guild.channels.fetch(logChannel).catch(() => null);
	if (channel?.isSendable())
		await channel
			.send(statusMessage(content, files))
			.catch(error => logger.warn(`[Tickets] Can't log in ${guild.id}:`, error.message));
};

const sendTranscript = async (thread: ThreadChannel, closedBy: User, reason?: string | null) => {
	const settings = await getTicketSettings(thread.guild.id);
	if (!settings.logChannel && !settings.transcriptDm) return;

	const record = await TicketModel.findOne({ threadId: thread.id }).lean();
	const authorId = record?.authorId ?? null;
	const file = await buildTranscript(thread, {
		subject: record?.subject ?? null,
		authorId,
		openedAt: record?.createdAt ?? thread.createdAt ?? new Date(),
		closedBy: closedBy.id,
		reason,
	});

	const t = (key: string, args?: Record<string, unknown>) => translateContext(thread.guild, key, args);
	const closed = await t("tickets/ticket:LOG_CLOSED", { user: closedBy.toString(), thread: thread.toString() });
	const lines = [
		`🔒 ${closed}`,
		reason && `> ${reason}`,
		authorId && `-# ${await t("tickets/ticket:LOG_AUTHOR", { user: `<@${authorId}>` })}`,
	];

	await postTicketLog(thread.guild, lines.filter(Boolean).join("\n"), [file]);

	if (settings.transcriptDm && authorId) {
		const author = await thread.client.users.fetch(authorId).catch(() => null);
		const text = await t("tickets/ticket:TRANSCRIPT_DM", {
			subject: record?.subject ?? thread.name,
			server: thread.guild.name,
		});

		await author?.send(statusMessage(text, [file])).catch(() => null);
	}
};

/** Posts the reason first, a locked and archived thread can't be written to anymore */
export const closeTicket = async (thread: ThreadChannel, closedBy: User, reason?: string | null) => {
	const key = reason ? "tickets/ticket:CLOSED_REASON" : "tickets/ticket:CLOSED";

	await thread.send(statusMessage(await translateContext(thread.guild, key, { user: closedBy.toString(), reason })));
	await TicketModel.updateOne({ threadId: thread.id }, { closedAt: new Date(), closedBy: closedBy.id });
	await thread.setLocked(true);
	await thread.setArchived(true);

	// Archived threads can still be read, so the transcript doesn't hold up closing
	await sendTranscript(thread, closedBy, reason).catch(error =>
		logger.warn(`[Tickets] Can't make a transcript of ${thread.id}:`, error),
	);
};

export const reopenTicket = async (thread: ThreadChannel, reopenedBy: User) => {
	await thread.setArchived(false);
	await thread.setLocked(false);
	await TicketModel.updateOne({ threadId: thread.id }, { closedAt: null, closedBy: null });
	await thread.send(
		statusMessage(await translateContext(thread.guild, "tickets/ticket:REOPENED", { user: reopenedBy.toString() })),
	);

	const reopened = await translateContext(thread.guild, "tickets/ticket:LOG_REOPENED", {
		user: reopenedBy.toString(),
		thread: thread.toString(),
	});
	await postTicketLog(thread.guild, `🔓 ${reopened}`);
};
