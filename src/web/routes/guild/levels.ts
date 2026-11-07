import { isSyncingLevelRoles, syncLevelRoles } from "@/helpers/levels.js";
import logger from "@/helpers/logger.js";
import MemberModel from "@/models/MemberModel.js";
import { LEVEL_UP_MODES, LevelReward, LevelSettings, LevelUpMode } from "@/models/GuildModel.js";
import useClient from "@/utils/use-client.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { ensureMembers } from "@/helpers/members-cache.js";
import { getAssignableRoles } from "../../roles.js";
import { fail, send } from "../../utils.js";

const MAX_REWARDS = 50;
const MAX_LEVEL = 1000;
const MAX_CREDITS = 1e9;

const serialize = (levels: LevelSettings) => ({
	mode: levels.mode,
	channel: levels.channel,
	stack: levels.stack,
	rewards: [...levels.rewards]
		.sort((a, b) => a.level - b.level)
		.map(r => ({ level: r.level, roleId: r.roleId, credits: r.credits })),
});

const isInt = (value: unknown, min: number, max: number): value is number =>
	typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

export default async function levelsRoutes(fastify: FastifyInstance) {
	fastify.get("/levels", async (req, reply) => {
		const guildData = await useClient().getGuildData(req.guild.id);

		return send(reply, { ...serialize(guildData.plugins.levels), roles: getAssignableRoles(req.guild) });
	});

	fastify.put("/levels", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as Record<string, unknown>;

		const mode = LEVEL_UP_MODES.find(m => m === body.mode) as LevelUpMode | undefined;
		if (!mode) return fail(reply, 400, "Unknown level up mode");

		const channel = mode === "channel" ? getSendableChannel(guild, body.channel) : null;
		if (mode === "channel" && !channel) return fail(reply, 400, "Pick a channel the bot can send messages to");

		const input = Array.isArray(body.rewards) ? (body.rewards as Record<string, unknown>[]) : [];
		if (input.length > MAX_REWARDS) return fail(reply, 400, `There can be up to ${MAX_REWARDS} rewards`);

		const rewards: LevelReward[] = [];
		for (const raw of input) {
			if (!isInt(raw?.level, 1, MAX_LEVEL)) return fail(reply, 400, `Levels must be from 1 to ${MAX_LEVEL}`);
			if (rewards.some(r => r.level === raw.level))
				return fail(reply, 400, `Level ${raw.level} has more than one reward`);

			const credits = raw.credits ?? 0;
			if (!isInt(credits, 0, MAX_CREDITS)) return fail(reply, 400, `Credits must be from 0 to ${MAX_CREDITS}`);

			let roleId: string | null = null;
			if (raw.roleId !== null && raw.roleId !== undefined) {
				const role = typeof raw.roleId === "string" ? guild.roles.cache.get(raw.roleId) : null;
				if (!role?.editable || role.managed || role.id === guild.id)
					return fail(reply, 400, `The bot can't give the role of level ${raw.level}`);

				roleId = role.id;
			}

			if (!roleId && !credits) return fail(reply, 400, `Level ${raw.level} needs a role or credits`);

			rewards.push({ level: raw.level, roleId, credits });
		}

		const guildData = await useClient().getGuildData(guild.id);
		const before = serialize(guildData.plugins.levels);

		guildData.set("plugins.levels", { mode, channel: channel?.id ?? null, stack: body.stack !== false, rewards });
		await guildData.save();

		const after = serialize(guildData.plugins.levels);
		await logAction(req, guild.id, {
			action: "levels.update",
			details: {
				before: { ...before, rewards: before.rewards.length },
				after: { ...after, rewards: after.rewards.length },
			},
		});

		return send(reply, after);
	});

	fastify.post("/levels/sync", async (req, reply) => {
		const guild = req.guild;
		if (isSyncingLevelRoles(guild.id)) return fail(reply, 409, "Rewards are already being given out");

		const { levels } = (await useClient().getGuildData(guild.id)).plugins;
		const lowest = Math.min(...levels.rewards.filter(r => r.roleId).map(r => r.level));
		if (!Number.isFinite(lowest)) return fail(reply, 400, "There are no reward roles");

		await ensureMembers(guild);

		const members = (
			await MemberModel.find({ guildID: guild.id, level: { $gte: lowest } }, { id: 1, level: 1 }).lean()
		).filter(m => guild.members.cache.has(m.id));

		// Role changes are rate limited, on a big server this takes minutes, so the request doesn't wait for it
		void syncLevelRoles(guild, members).catch(error =>
			logger.error(`[Levels] Failed to sync reward roles in ${guild.id}:`, error),
		);

		await logAction(req, guild.id, { action: "levels.sync", details: { members: members.length } });

		return send(reply, { members: members.length }, 202);
	});
}
