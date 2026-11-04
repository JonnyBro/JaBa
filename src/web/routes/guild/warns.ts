import { getUsername } from "@/helpers/functions.js";
import {
	addWarn,
	canWarn,
	getWarns,
	getWarnSettings,
	isActive,
	MAX_REASON,
	removeWarn,
	shortId,
	Warn,
} from "@/helpers/warns.js";
import { WARN_ACTIONS, WarnAction, WarnRule, WarnSettings } from "@/models/GuildModel.js";
import WarnModel from "@/models/WarnModel.js";
import useClient from "@/utils/use-client.js";
import { Guild, PermissionsBitField } from "discord.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { fail, send } from "../../utils.js";

const RECENT_LIMIT = 50;
const MAX_RULES = 10;
const MAX_EXPIRE_DAYS = 365;
const MAX_TIMEOUT_MINUTES = 28 * 24 * 60;

const serializeSettings = (settings: WarnSettings) => ({
	expireDays: settings.expireDays,
	logChannel: settings.logChannel,
	dm: settings.dm,
	rules: [...settings.rules]
		.sort((a, b) => a.count - b.count)
		.map(r => ({ count: r.count, action: r.action, minutes: r.minutes })),
});

const serializeWarn = (guild: Guild, warn: Warn, settings: WarnSettings) => {
	const member = guild.members.cache.get(warn.userId);

	return {
		id: warn._id.toString(),
		shortId: shortId(warn),
		userId: warn.userId,
		userName: member ? getUsername(member) : null,
		userAvatar: member?.displayAvatarURL({ size: 64 }) ?? null,
		moderatorId: warn.moderatorId,
		moderatorName: guild.members.cache.get(warn.moderatorId)?.displayName ?? null,
		reason: warn.reason,
		createdAt: warn.createdAt.getTime(),
		removed: !!warn.removedAt,
		active: isActive(warn, settings),
	};
};

const isInt = (value: unknown, min: number, max: number): value is number =>
	typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

export default async function warnsRoutes(fastify: FastifyInstance) {
	fastify.get("/warns", async (req, reply) => {
		const settings = await getWarnSettings(req.guild.id);
		const recent = await WarnModel.find({ guildId: req.guild.id })
			.sort({ createdAt: -1 })
			.limit(RECENT_LIMIT)
			.lean();

		return send(reply, {
			settings: serializeSettings(settings),
			recent: recent.map(warn => serializeWarn(req.guild, warn, settings)),
		});
	});

	fastify.put("/warns/settings", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as Record<string, unknown>;

		if (!isInt(body.expireDays, 0, MAX_EXPIRE_DAYS))
			return fail(reply, 400, `Expiry must be from 0 to ${MAX_EXPIRE_DAYS} days`);

		let logChannel: string | null = null;
		if (body.logChannel) {
			const channel = getSendableChannel(guild, body.logChannel);
			if (!channel) return fail(reply, 400, "The bot can't send messages in the log channel");

			logChannel = channel.id;
		}

		const input = Array.isArray(body.rules) ? (body.rules as Record<string, unknown>[]) : [];
		if (input.length > MAX_RULES) return fail(reply, 400, `There can be up to ${MAX_RULES} rules`);

		const rules: WarnRule[] = [];
		for (const raw of input) {
			if (!isInt(raw?.count, 1, 100)) return fail(reply, 400, "Warn counts must be from 1 to 100");
			if (rules.some(r => r.count === raw.count))
				return fail(reply, 400, `${raw.count} warns has more than one rule`);

			const action = WARN_ACTIONS.find(a => a === raw.action) as WarnAction | undefined;
			if (!action) return fail(reply, 400, "Unknown punishment");

			const minutes = action === "timeout" ? raw.minutes : null;
			if (action === "timeout" && !isInt(minutes, 1, MAX_TIMEOUT_MINUTES))
				return fail(reply, 400, `Timeouts must be from 1 to ${MAX_TIMEOUT_MINUTES} minutes`);

			rules.push({ count: raw.count, action, minutes: minutes as number | null });
		}

		const guildData = await useClient().getGuildData(guild.id);
		const before = serializeSettings(guildData.plugins.warns);

		guildData.set("plugins.warns", { expireDays: body.expireDays, logChannel, dm: body.dm !== false, rules });
		await guildData.save();

		const after = serializeSettings(guildData.plugins.warns);
		const summary = (s: ReturnType<typeof serializeSettings>) => ({ ...s, rules: s.rules.length });
		await logAction(req, guild.id, {
			action: "warns.settings",
			details: { before: summary(before), after: summary(after) },
		});

		return send(reply, after);
	});

	fastify.get("/members/:userId/warns", async (req, reply) => {
		const { userId } = req.params as { userId: string };
		const [warns, settings] = await Promise.all([getWarns(req.guild.id, userId), getWarnSettings(req.guild.id)]);

		return send(
			reply,
			warns.map(warn => serializeWarn(req.guild, warn, settings)),
		);
	});

	fastify.post("/members/:userId/warns", async (req, reply) => {
		const guild = req.guild;
		const { userId } = req.params as { userId: string };
		const body = (req.body ?? {}) as { reason?: unknown };

		const [actor, target] = await Promise.all([
			guild.members.fetch(req.session.user!.id).catch(() => null),
			guild.members.fetch(userId).catch(() => null),
		]);
		if (!target) return fail(reply, 404, "Member not found");
		if (!actor?.permissions.has(PermissionsBitField.Flags.ModerateMembers) || !canWarn(actor, target))
			return fail(reply, 403, "You can't warn this member");

		const reason =
			typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, MAX_REASON) : null;
		const result = await addWarn(target, actor.id, reason);

		await logAction(req, guild.id, {
			action: "member.warn",
			target: { id: target.id, name: getUsername(target) },
			details: { reason, count: result.count },
		});

		return send(reply, { count: result.count, punishment: result.punishment, punished: result.punished });
	});

	fastify.delete("/warns/:warnId", async (req, reply) => {
		const { warnId } = req.params as { warnId: string };

		const warn = await removeWarn(req.guild, warnId, req.session.user!.id);
		if (!warn) return fail(reply, 404, "Active warn not found");

		const member = req.guild.members.cache.get(warn.userId);
		await logAction(req, req.guild.id, {
			action: "member.unwarn",
			target: { id: warn.userId, name: member ? getUsername(member) : warn.userId },
			details: { warn: shortId(warn) },
		});

		return send(reply, { ok: true });
	});
}
