import { getUsername } from "@/helpers/functions.js";
import MemberModel from "@/models/MemberModel.js";
import UserModel from "@/models/UserModel.js";
import useClient from "@/utils/use-client.js";
import { GuildMember, PermissionsBitField } from "discord.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { logAction } from "../../audit.js";
import { ensureMembers } from "../../members-cache.js";
import { fail, send } from "../../utils.js";

const MAX_PAGE_SIZE = 100;
const MAX_AMOUNT = 1e12;
const MAX_TIMEOUT_MINUTES = 28 * 24 * 60;
const ECONOMY_FIELDS = ["money", "bank", "exp", "level"] as const;
const SORTS = ["name", "money", "bank", "level", "joined"] as const;
const MODERATION_ACTIONS = ["kick", "ban", "timeout"] as const;

type EconomyField = (typeof ECONOMY_FIELDS)[number];
type Economy = Record<EconomyField, number>;

const EMPTY_ECONOMY: Economy = { money: 0, bank: 0, exp: 0, level: 0 };

const serializeMember = (member: GuildMember, economy?: Partial<Economy> | null) => ({
	id: member.id,
	username: getUsername(member),
	displayName: member.displayName,
	avatar: member.displayAvatarURL({ size: 128 }),
	bot: member.user.bot,
	joinedAt: member.joinedTimestamp,
	timeoutUntil: member.isCommunicationDisabled() ? member.communicationDisabledUntilTimestamp : null,
	economy: member.user.bot ? null : { ...EMPTY_ECONOMY, ...pickEconomy(economy) },
});

const pickEconomy = (data?: Partial<Economy> | null) =>
	Object.fromEntries(ECONOMY_FIELDS.map(field => [field, Number(data?.[field] ?? 0)])) as Economy;

const getTarget = async (req: FastifyRequest, reply: FastifyReply) => {
	const member = await req.guild.members.fetch((req.params as { userId: string }).userId).catch(() => null);
	if (!member) fail(reply, 404, "Member not found");

	return member;
};

const getActor = (req: FastifyRequest) => req.guild.members.fetch(req.session.user!.id).catch(() => null);

const outranks = (actor: GuildMember, target: GuildMember) =>
	actor.id === actor.guild.ownerId || actor.roles.highest.comparePositionTo(target.roles.highest) > 0;

/** What the signed in user can do to the member, the bot itself must be able to do it too */
const getModeration = (actor: GuildMember | null, target: GuildMember) => {
	const allowed = (permission: bigint, botCan: boolean) =>
		!!actor &&
		actor.id !== target.id &&
		target.id !== target.guild.ownerId &&
		actor.permissions.has(permission) &&
		outranks(actor, target) &&
		botCan;

	return {
		kick: allowed(PermissionsBitField.Flags.KickMembers, target.kickable),
		ban: allowed(PermissionsBitField.Flags.BanMembers, target.bannable),
		timeout: allowed(PermissionsBitField.Flags.ModerateMembers, target.moderatable),
	};
};

const auditReason = (req: FastifyRequest, reason: unknown) => {
	const user = req.session.user!;
	const text = typeof reason === "string" && reason.trim() ? reason.trim() : "No reason";

	return `${text} (by ${user.username} via dashboard)`.slice(0, 512);
};

export default async function membersRoutes(fastify: FastifyInstance) {
	fastify.get("/members", async (req, reply) => {
		const guild = req.guild;
		const query = req.query as { q?: string; sort?: string; page?: string; limit?: string };

		const limit = Math.min(Math.max(Number(query.limit) || 25, 1), MAX_PAGE_SIZE);
		const page = Math.max(Number(query.page) || 1, 1);
		const sort = SORTS.find(s => s === query.sort) ?? "name";
		const q = query.q?.trim().toLowerCase();

		await ensureMembers(guild);

		const economy = new Map(
			(await MemberModel.find({ guildID: guild.id }).lean()).map(doc => [doc.id, pickEconomy(doc)]),
		);

		const members = [...guild.members.cache.values()]
			.filter(
				m =>
					!q ||
					m.id === q ||
					m.user.username.toLowerCase().includes(q) ||
					m.displayName.toLowerCase().includes(q),
			)
			.map(m => serializeMember(m, economy.get(m.id)));

		members.sort((a, b) => {
			if (sort === "name") return a.displayName.localeCompare(b.displayName);
			if (sort === "joined") return (a.joinedAt ?? 0) - (b.joinedAt ?? 0);

			// Bots have no economy and go to the end
			return (b.economy?.[sort] ?? -1) - (a.economy?.[sort] ?? -1);
		});

		return send(reply, {
			items: members.slice((page - 1) * limit, page * limit),
			total: members.length,
		});
	});

	fastify.get("/members/:userId", async (req, reply) => {
		const target = await getTarget(req, reply);
		if (!target) return;

		const [memberData, userData, actor] = await Promise.all([
			MemberModel.findOne({ guildID: req.guild.id, id: target.id }).lean(),
			UserModel.findOne({ id: target.id }).lean(),
			getActor(req),
		]);

		return send(reply, {
			...serializeMember(target, memberData),
			registeredAt: memberData?.registeredAt ?? null,
			rep: userData?.rep ?? 0,
			roles: target.roles.cache
				.filter(r => r.id !== target.guild.id)
				.sort((a, b) => b.position - a.position)
				.map(r => ({ id: r.id, name: r.name, color: r.hexColor })),
			transactions: [...(memberData?.transactions ?? [])].sort((a, b) => b.date - a.date).slice(0, 20),
			moderation: getModeration(actor, target),
		});
	});

	fastify.patch("/members/:userId/economy", async (req, reply) => {
		const target = await getTarget(req, reply);
		if (!target) return;

		if (target.user.bot) return fail(reply, 400, "Bots don't take part in the economy");

		const body = (req.body ?? {}) as Partial<Record<EconomyField, unknown>>;
		const changes: Partial<Economy> = {};

		for (const field of ECONOMY_FIELDS) {
			const value = body[field];
			if (value === undefined) continue;

			if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_AMOUNT)
				return fail(reply, 400, `${field} must be a whole number from 0 to ${MAX_AMOUNT}`);

			changes[field] = value;
		}

		if (!Object.keys(changes).length) return fail(reply, 400, "Nothing to change");

		const memberData = await useClient().getMemberData(req.guild.id, target.id);
		const before = pickEconomy(memberData);

		memberData.set(changes);
		await memberData.save();

		await logAction(req, req.guild.id, {
			action: "member.economy",
			target: { id: target.id, name: getUsername(target) },
			details: { before, after: pickEconomy(memberData) },
		});

		return send(reply, pickEconomy(memberData));
	});

	fastify.post("/members/:userId/reset", async (req, reply) => {
		const target = await getTarget(req, reply);
		if (!target) return;

		if (target.user.bot) return fail(reply, 400, "Bots don't take part in the economy");

		await MemberModel.deleteOne({ guildID: req.guild.id, id: target.id });
		await logAction(req, req.guild.id, {
			action: "member.reset",
			target: { id: target.id, name: getUsername(target) },
		});

		return send(reply, EMPTY_ECONOMY);
	});

	fastify.post("/economy/reset", async (req, reply) => {
		const { deletedCount } = await MemberModel.deleteMany({ guildID: req.guild.id });

		await logAction(req, req.guild.id, { action: "economy.reset", details: { members: deletedCount } });

		return send(reply, { members: deletedCount });
	});

	for (const action of MODERATION_ACTIONS)
		fastify.post(`/members/:userId/${action}`, async (req, reply) => {
			const target = await getTarget(req, reply);
			if (!target) return;

			if (!getModeration(await getActor(req), target)[action])
				return fail(reply, 403, "You or the bot can't do that to this member");

			const body = (req.body ?? {}) as { reason?: unknown; minutes?: unknown; deleteMessageDays?: unknown };
			const reason = auditReason(req, body.reason);
			const details: Record<string, unknown> = { reason: typeof body.reason === "string" ? body.reason : null };

			if (action === "kick") await target.kick(reason);

			if (action === "ban") {
				const days = Math.min(Math.max(Number(body.deleteMessageDays) || 0, 0), 7);

				await target.ban({ reason, deleteMessageSeconds: days * 24 * 60 * 60 });
				details.deleteMessageDays = days;
			}

			if (action === "timeout") {
				const minutes = body.minutes === null ? null : Number(body.minutes);

				if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_TIMEOUT_MINUTES))
					return fail(reply, 400, `minutes must be from 1 to ${MAX_TIMEOUT_MINUTES} or null`);

				await target.timeout(minutes === null ? null : minutes * 60_000, reason);
				details.minutes = minutes;
			}

			await logAction(req, req.guild.id, {
				action: `member.${action}`,
				target: { id: target.id, name: getUsername(target) },
				details,
			});

			return send(reply, { ok: true });
		});
}
