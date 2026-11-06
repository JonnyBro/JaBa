import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { COLORS, formatUser, getModLogChannel, postModLog, quote, timestamp } from "@/helpers/modlog.js";
import { HoneypotAction, HoneypotChannel, HoneypotSettings } from "@/models/GuildModel.js";
import { componentRouter } from "@/utils/component-router.js";
import { containerMessage, createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerComponent,
	Guild,
	GuildMember,
	Message,
	MessageFlags,
	PermissionsBitField,
	TextDisplayComponent,
} from "discord.js";

const UNDO_ID = "honeypot_undo";
const HANDLING_TTL = 30_000;
const HOUR = 3_600_000;

/** Members being punished right now, so a burst of spam doesn't punish them several times */
const handling = new Set<string>();

type WarningSettings = Pick<HoneypotSettings, "action" | "warningText">;

const t = (guild: Guild, key: string, args?: Record<string, unknown>) =>
	translateContext(guild, `honeypot:${key}`, args);

export const getHoneypotSettings = async (guildId: string) =>
	(await useClient().getGuildData(guildId)).plugins.honeypot;

export const isHoneypotChannel = async (guildId: string, channelId: string) =>
	(await getHoneypotSettings(guildId)).channels.some(channel => channel.id === channelId);

const isExempt = (member: GuildMember) =>
	member.id === member.guild.ownerId ||
	member.permissions.any([
		PermissionsBitField.Flags.ManageMessages,
		PermissionsBitField.Flags.ManageGuild,
		PermissionsBitField.Flags.BanMembers,
		PermissionsBitField.Flags.ModerateMembers,
	]);

// Warnings
export const buildWarning = async (guild: Guild, settings: WarningSettings) => {
	const text = settings.warningText?.trim() || (await t(guild, `WARNING_${settings.action.toUpperCase()}`));

	return containerMessage(createContainer(COLORS.red).addTextDisplayComponents(createText(text)));
};

const getTextChannel = (guild: Guild, channelId: string) => {
	const channel = guild.channels.cache.get(channelId);

	return channel?.isTextBased() && channel.isSendable() ? channel : null;
};

const deleteWarning = async (guild: Guild, channelId: string, messageId: string) => {
	const channel = getTextChannel(guild, channelId);
	await channel?.messages.delete(messageId).catch(() => {});
};

const upsertWarning = async (
	guild: Guild,
	channelId: string,
	messageId: string | null,
	payload: Awaited<ReturnType<typeof buildWarning>>,
) => {
	const channel = getTextChannel(guild, channelId);
	if (!channel) return null;

	const existing = messageId ? await channel.messages.fetch(messageId).catch(() => null) : null;
	if (existing) {
		await existing.edit(payload).catch(() => {});

		return existing.id;
	}

	const sent = await channel.send(payload).catch(() => null);

	return sent?.id ?? null;
};

/** Posts, edits or removes the warnings so they match the new settings, returns the channels with message ids */
export const syncWarnings = async (
	guild: Guild,
	previous: HoneypotChannel[],
	settings: WarningSettings & { channels: string[]; warning: boolean },
) => {
	for (const { id, messageId } of previous)
		if (messageId && (!settings.warning || !settings.channels.includes(id)))
			await deleteWarning(guild, id, messageId);

	const payload = settings.warning ? await buildWarning(guild, settings) : null;
	const known = new Map(previous.map(channel => [channel.id, channel.messageId]));
	const channels: HoneypotChannel[] = [];

	for (const id of settings.channels) {
		const messageId = payload ? await upsertWarning(guild, id, known.get(id) ?? null, payload) : null;
		channels.push({ id, messageId });
	}

	return channels;
};

// Punishment
const punish = async (member: GuildMember, settings: HoneypotSettings, reason: string) => {
	try {
		if (settings.action === "timeout") {
			if (!member.moderatable) return false;
			await member.timeout(settings.timeoutMinutes * 60_000, reason);

			return true;
		}

		if (!member.bannable) return false;
		await member.guild.members.ban(member, { reason, deleteMessageSeconds: settings.deleteHours * 3600 });
		if (settings.action === "softban") await member.guild.members.unban(member.id, reason);

		return true;
	} catch (error) {
		logger.warn(`[Honeypot] Can't punish ${member.id} in ${member.guild.id}:`, error);

		return false;
	}
};

// Bans clean up the messages on Discord's side, timeouts don't, so this goes through what the bot has seen
const deleteRecentMessages = async (guild: Guild, userId: string, hours: number) => {
	if (!hours) return;

	const since = Date.now() - hours * HOUR;

	for (const channel of guild.channels.cache.values()) {
		if (!channel.isTextBased()) continue;

		const messages = channel.messages.cache.filter(m => m.author.id === userId && m.createdTimestamp >= since);
		if (messages.size === 1)
			await messages
				.first()
				?.delete()
				.catch(() => {});
		else if (messages.size > 1) await channel.bulkDelete(messages, true).catch(() => {});
	}
};

const sendDm = async (member: GuildMember, settings: HoneypotSettings) => {
	const text = await t(member.guild, `DM_${settings.action.toUpperCase()}`, {
		guild: member.guild.name,
		date: timestamp(Date.now() + settings.timeoutMinutes * 60_000),
	});

	await member.send({ content: text, allowedMentions: { parse: [] } }).catch(() => {});
};

const undoButton = async (guild: Guild, action: HoneypotAction, userId: string) =>
	new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`${UNDO_ID}:${action}:${userId}`)
			.setLabel(await translateContext(guild, "modlog:HONEYPOT_UNDO"))
			.setStyle(ButtonStyle.Secondary),
	);

export const handleHoneypotMessage = async (message: Message<true>) => {
	const { guild } = message;
	const settings = await getHoneypotSettings(guild.id);
	if (!settings.channels.some(channel => channel.id === message.channelId)) return;

	const member = message.member ?? (await guild.members.fetch(message.author.id).catch(() => null));
	if (!member || isExempt(member)) return;

	const key = `${guild.id}:${member.id}`;
	if (handling.has(key)) return void (await message.delete().catch(() => {}));

	handling.add(key);
	setTimeout(() => handling.delete(key), HANDLING_TTL);

	const logChannel = await getModLogChannel(guild, "honeypot");
	const forwarded = !!logChannel && !!(await message.forward(logChannel).catch(() => null));
	await message.delete().catch(() => {});

	// The DM goes first, after a ban the bot can't reach the member anymore
	const canPunish = settings.action === "timeout" ? member.moderatable : member.bannable;
	if (settings.dm && canPunish) await sendDm(member, settings);

	const punished = await punish(member, settings, await t(guild, "REASON", { channel: message.channel.name }));
	if (settings.action === "timeout" || !punished) await deleteRecentMessages(guild, member.id, settings.deleteHours);

	const ends = timestamp(Date.now() + settings.timeoutMinutes * 60_000);
	const result = punished ? `HONEYPOT_${settings.action.toUpperCase()}` : "HONEYPOT_FAILED";

	await postModLog(
		guild,
		"honeypot",
		{ color: COLORS.red, buttons: punished ? await undoButton(guild, settings.action, member.id) : undefined },
		async lt => [
			`**🍯 ${await lt("HONEYPOT", { user: formatUser(member), channel: `<#${message.channelId}>` })}**`,
			await lt(result, { date: ends }),
			!!settings.deleteHours && (await lt("HONEYPOT_DELETED", { hours: settings.deleteHours })),
			!forwarded && !!message.content && quote(message.content),
			`-# ID: ${member.id}`,
		],
	);
};

const undo = async (guild: Guild, action: string, userId: string, reason: string) => {
	if (action === "softban") return true;
	if (action === "ban") return !!(await guild.members.unban(userId, reason).catch(() => null));

	const target = await guild.members.fetch(userId).catch(() => null);

	return !target || !!(await target.timeout(null, reason).catch(() => null));
};

componentRouter.register(UNDO_ID, async interaction => {
	if (!interaction.isButton() || !interaction.inCachedGuild()) return;

	const [, action, userId] = interaction.customId.split(":");
	const { guild, member } = interaction;
	const permission =
		action === "timeout" ? PermissionsBitField.Flags.ModerateMembers : PermissionsBitField.Flags.BanMembers;

	if (!member.permissions.has(permission))
		return void (await interaction.reply({
			content: await translateContext(interaction, "honeypot:UNDO_NO_PERMISSION"),
			flags: MessageFlags.Ephemeral,
		}));

	const reason = await t(guild, "UNDO_REASON", { user: interaction.user.username });
	if (!(await undo(guild, action, userId, reason)))
		return void (await interaction.reply({
			content: await translateContext(interaction, "honeypot:UNDO_FAILED"),
			flags: MessageFlags.Ephemeral,
		}));

	const original = interaction.message.components[0];
	const lines =
		original instanceof ContainerComponent
			? original.components.filter(c => c instanceof TextDisplayComponent).map(c => c.content)
			: [];
	const by = formatUser(interaction.user);
	lines.push(
		await translateContext(guild, action === "softban" ? "modlog:HONEYPOT_MISTAKE" : "modlog:HONEYPOT_UNDONE", {
			user: by,
		}),
	);

	const container = createContainer(COLORS.gray).addTextDisplayComponents(createText(lines.join("\n")));

	await interaction.update(containerMessage(container));
});
