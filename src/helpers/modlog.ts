import { shortenString, translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { ModLogEvent } from "@/models/GuildModel.js";
import { containerMessage, createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	AuditLogEvent,
	ButtonBuilder,
	ColorResolvable,
	Guild,
	GuildMember,
	PartialUser,
	PermissionsBitField,
	User,
} from "discord.js";
import { setTimeout as sleep } from "node:timers/promises";

const TEXT_LIMIT = 4000;
const AUDIT_DELAY = 1500;
const AUDIT_MAX_AGE = 20_000;

export const COLORS = {
	red: "#ED4245",
	orange: "#F0A020",
	green: "#57F287",
	blue: "#5865F2",
	gray: "#99AAB5",
} satisfies Record<string, ColorResolvable>;

export type Translate = (key: string, args?: Record<string, unknown>) => Promise<string>;
type Line = string | null | undefined | false;

interface LogOptions {
	color: ColorResolvable;
	/** Where the logged message was, ignored channels and the log channel itself are skipped */
	source?: { channelId: string; parentId?: string | null };
	buttons?: ActionRowBuilder<ButtonBuilder>;
}

export const getModLogChannel = async (guild: Guild, event: ModLogEvent, source?: LogOptions["source"]) => {
	const settings = (await useClient().getGuildData(guild.id)).plugins.modlog;
	if (!settings.channel || !settings.events[event]) return null;

	if (
		source &&
		[source.channelId, source.parentId].some(
			id => id && (id === settings.channel || settings.ignoredChannels.includes(id)),
		)
	)
		return null;

	const channel = await guild.channels.fetch(settings.channel).catch(() => null);

	return channel?.isSendable() ? channel : null;
};

export const postModLog = async (
	guild: Guild,
	event: ModLogEvent,
	options: LogOptions,
	build: (t: Translate) => Promise<Line[]>,
) => {
	try {
		const channel = await getModLogChannel(guild, event, options.source);
		if (!channel) return;

		const t: Translate = (key, args) => translateContext(guild, `modlog:${key}`, args);
		const content = (await build(t)).filter(Boolean).join("\n");
		if (!content) return;

		const container = createContainer(options.color).addTextDisplayComponents(
			createText(shortenString(content, TEXT_LIMIT)),
		);
		if (options.buttons) container.addActionRowComponents(options.buttons);

		await channel.send(containerMessage(container));
	} catch (error) {
		logger.warn(`[ModLog] Can't log ${event} in ${guild.id}:`, error);
	}
};

export const formatUser = (user: User | PartialUser | GuildMember | null | undefined, fallbackId?: string | null) => {
	if (!user) return fallbackId ? `<@${fallbackId}>` : "?";

	const name = user instanceof GuildMember ? user.user.username : user.username;

	return name ? `<@${user.id}> (\`${name}\`)` : `<@${user.id}>`;
};

export const quote = (text: string, max = 1000) =>
	shortenString(text, max)
		.split("\n")
		.map(line => `> ${line}`)
		.join("\n");

export const timestamp = (ms: number, style = "f") => `<t:${Math.floor(ms / 1000)}:${style}>`;

export const findAuditEntry = async (guild: Guild, type: AuditLogEvent, targetId: string) => {
	if (!guild.members.me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return null;

	// Discord writes the audit log entry a moment after the gateway event, without the wait it's often not there yet
	await sleep(AUDIT_DELAY);

	const logs = await guild.fetchAuditLogs({ type, limit: 5 }).catch(() => null);

	return (
		logs?.entries.find(
			entry => entry.targetId === targetId && Date.now() - entry.createdTimestamp < AUDIT_MAX_AGE,
		) ?? null
	);
};
