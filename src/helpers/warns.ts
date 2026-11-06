import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { COLORS, postModLog } from "@/helpers/modlog.js";
import { WarnRule, WarnSettings } from "@/models/GuildModel.js";
import WarnModel, { IWarnSchema } from "@/models/WarnModel.js";
import { createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import { ColorResolvable, Guild, GuildMember, MessageCreateOptions, MessageFlags } from "discord.js";
import { QueryFilter, Types } from "mongoose";

export const MAX_REASON = 500;
const DAY = 24 * 60 * 60 * 1000;

export type Warn = IWarnSchema;

export const shortId = (warn: Pick<Warn, "_id">) => warn._id.toString().slice(-6);

export const getWarnSettings = async (guildId: string) => (await useClient().getGuildData(guildId)).plugins.warns;

export const isActive = (warn: Pick<Warn, "removedAt" | "createdAt">, settings: Pick<WarnSettings, "expireDays">) =>
	!warn.removedAt && (!settings.expireDays || warn.createdAt.getTime() > Date.now() - settings.expireDays * DAY);

const activeFilter = (guildId: string, userId: string, expireDays: number): QueryFilter<Warn> => ({
	guildId,
	userId,
	removedAt: null,
	...(expireDays && { createdAt: { $gt: new Date(Date.now() - expireDays * DAY) } }),
});

export const getWarns = (guildId: string, userId: string) =>
	WarnModel.find({ guildId, userId }).sort({ createdAt: -1 }).lean();

/** Moderators can only warn members below them, the same rule Discord uses for kicks and bans */
export const canWarn = (moderator: GuildMember, target: GuildMember) =>
	!target.user.bot &&
	moderator.id !== target.id &&
	target.id !== target.guild.ownerId &&
	(moderator.id === moderator.guild.ownerId || moderator.roles.highest.comparePositionTo(target.roles.highest) > 0);

const message = (content: string): MessageCreateOptions => ({
	flags: MessageFlags.IsComponentsV2,
	components: [createContainer().addTextDisplayComponents(createText(content))],
	allowedMentions: { parse: [] },
});

const describeRule = async (guild: Guild, rule: WarnRule) =>
	translateContext(guild, `administration/warn:ACTIONS:${rule.action}`, { minutes: rule.minutes ?? 0 });

const postLog = (guild: Guild, color: ColorResolvable, content: string) =>
	postModLog(guild, "warns", { color }, async () => [content]);

const punish = async (target: GuildMember, rule: WarnRule, reason: string) => {
	try {
		if (rule.action === "timeout" && target.moderatable)
			return !!(await target.timeout((rule.minutes ?? 60) * 60 * 1000, reason));
		if (rule.action === "kick" && target.kickable) return !!(await target.kick(reason));
		if (rule.action === "ban" && target.bannable) return !!(await target.ban({ reason }));
	} catch (error) {
		logger.warn(`[Warns] Can't punish ${target.id} in ${target.guild.id}:`, error);
	}

	return false;
};

export const addWarn = async (target: GuildMember, moderatorId: string, reason: string | null) => {
	const guild = target.guild;
	const settings = await getWarnSettings(guild.id);
	const t = (key: string, args?: Record<string, unknown>) => translateContext(guild, key, args);

	const warn = (await WarnModel.create({ guildId: guild.id, userId: target.id, moderatorId, reason })).toObject();
	const count = await WarnModel.countDocuments(activeFilter(guild.id, target.id, settings.expireDays));
	const rule = settings.rules.find(r => r.count === count) ?? null;
	const punishment = rule && (await describeRule(guild, rule));
	const reasonText = reason ?? (await t("administration/warn:NO_REASON"));

	// The DM goes first, after a kick or a ban the bot can't reach the member anymore
	if (settings.dm)
		await target
			.send(
				message(
					[
						await t("administration/warn:DM", { server: guild.name, count }),
						`> ${reasonText}`,
						punishment && `-# ${await t("administration/warn:DM_PUNISHMENT", { punishment })}`,
					]
						.filter(Boolean)
						.join("\n"),
				),
			)
			.catch(() => null);

	const punished = rule ? await punish(target, rule, `${count} warns: ${reasonText}`.slice(0, 512)) : false;

	const added = await t("administration/warn:LOG_ADDED", {
		user: target.toString(),
		moderator: `<@${moderatorId}>`,
		count,
	});
	const outcome =
		punishment &&
		(await t(punished ? "administration/warn:LOG_PUNISHED" : "administration/warn:LOG_PUNISH_FAILED", {
			punishment,
		}));

	await postLog(
		guild,
		COLORS.orange,
		[`⚠️ ${added}`, `> ${reasonText}`, outcome && `-# ${outcome}`, `-# #${shortId(warn)}`]
			.filter(Boolean)
			.join("\n"),
	);

	return { warn, count, punishment, punished };
};

export const removeWarn = async (guild: Guild, warnId: string, removedBy: string) => {
	if (!Types.ObjectId.isValid(warnId)) return null;

	const warn = await WarnModel.findOneAndUpdate(
		{ _id: warnId, guildId: guild.id, removedAt: null },
		{ removedBy, removedAt: new Date() },
		{ returnDocument: "after" },
	).lean();
	if (!warn) return null;

	await postLog(
		guild,
		COLORS.green,
		`✅ ${await translateContext(guild, "administration/warn:LOG_REMOVED", {
			id: shortId(warn),
			user: `<@${warn.userId}>`,
			moderator: `<@${removedBy}>`,
		})}`,
	);

	return warn;
};
