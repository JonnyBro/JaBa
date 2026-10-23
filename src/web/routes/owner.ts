import { getRecentLogs, logEvents } from "@/helpers/logger.js";
import { notifyMusicChange } from "@/helpers/music-events.js";
import { applyPresence } from "@/helpers/presence.js";
import { getMigrationStatus } from "@/migrations/index.js";
import BlacklistModel, { BlacklistType } from "@/models/BlacklistModel.js";
import CommandUsageModel from "@/models/CommandUsageModel.js";
import {
	addToBlacklist,
	getBotSettings,
	removeFromBlacklist,
	updateBotSettings,
} from "@/services/bot-settings/index.js";
import { CronManager } from "@/services/cron/index.js";
import useClient from "@/utils/use-client.js";
import { FastifyInstance } from "fastify";
import { fail, isOwner, send } from "../utils.js";

const MAX_TEXT = 128;
const MAX_REASON = 500;
const MAX_STATS_DAYS = 90;
const BLACKLIST_TYPES: BlacklistType[] = ["user", "guild"];

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export default async function ownerRoutes(fastify: FastifyInstance) {
	fastify.addHook("preHandler", async (req, reply) => {
		if (!isOwner(req.session.user?.id)) return fail(reply, 403, "Owner only");
	});

	fastify.get("/settings", async (_req, reply) => send(reply, getBotSettings()));

	fastify.patch("/settings", async (req, reply) => {
		const body = (req.body ?? {}) as { maintenance?: { enabled?: unknown; message?: unknown }; status?: unknown };
		const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
		const current = getBotSettings();

		if ([body.maintenance?.message, body.status].some(v => typeof v === "string" && v.length > MAX_TEXT))
			return fail(reply, 400, `Texts must be up to ${MAX_TEXT} characters`);

		const maintenance = body.maintenance
			? { enabled: body.maintenance.enabled === true, message: text(body.maintenance.message) }
			: current.maintenance;
		const status = body.status !== undefined ? text(body.status) : current.status;
		const settings = await updateBotSettings({ maintenance, status });

		applyPresence();

		return send(reply, settings);
	});

	fastify.get("/guilds", async (_req, reply) => {
		const client = useClient();
		const blacklisted = new Set((await BlacklistModel.find({ type: "guild" }).lean()).map(e => e.id));

		const guilds = client.guilds.cache
			.map(guild => ({
				id: guild.id,
				name: guild.name,
				icon: guild.iconURL({ size: 64 }),
				memberCount: guild.memberCount,
				joinedAt: guild.joinedTimestamp,
				ownerId: guild.ownerId,
				playing: !!client.lavalink.getPlayer(guild.id)?.queue.current,
				blacklisted: blacklisted.has(guild.id),
			}))
			.sort((a, b) => b.memberCount - a.memberCount);

		return send(reply, guilds);
	});

	fastify.post("/guilds/:id/leave", async (req, reply) => {
		const guild = useClient().guilds.cache.get((req.params as { id: string }).id);
		if (!guild) return fail(reply, 404, "The bot is not on this server");

		await guild.leave();

		return send(reply, { ok: true });
	});

	fastify.get("/lavalink", async (_req, reply) => {
		const client = useClient();

		const allPlayers = [...client.lavalink.players.values()];

		// node.stats comes from Lavalink once a minute and doesn't count resumed players, the bot's own list is exact
		const nodes = [...client.lavalink.nodeManager.nodes.values()].map(node => {
			const players = allPlayers.filter(p => p.node.id === node.id);

			return {
				id: node.id,
				connected: node.connected,
				version: node.info?.version.semver ?? null,
				players: players.length,
				playingPlayers: players.filter(p => p.queue.current && !p.paused).length,
				uptime: node.stats?.uptime ?? 0,
				memory: node.stats ? { used: node.stats.memory.used, allocated: node.stats.memory.allocated } : null,
				cpu: node.stats ? { lavalink: node.stats.cpu.lavalinkLoad, system: node.stats.cpu.systemLoad } : null,
			};
		});

		const players = allPlayers.map(player => {
			const guild = client.guilds.cache.get(player.guildId);
			const voice = player.voiceChannelId ? guild?.channels.cache.get(player.voiceChannelId) : null;

			return {
				guildId: player.guildId,
				guildName: guild?.name ?? player.guildId,
				voiceChannel: voice?.name ?? null,
				listeners: voice?.isVoiceBased() ? voice.members.filter(m => !m.user.bot).size : 0,
				current: player.queue.current?.info.title ?? null,
				paused: player.paused,
				queue: player.queue.tracks.length,
				node: player.node.id,
			};
		});

		return send(reply, { nodes, players });
	});

	fastify.post("/lavalink/players/:guildId/destroy", async (req, reply) => {
		const guildId = (req.params as { guildId: string }).guildId;
		const player = useClient().lavalink.getPlayer(guildId);
		if (!player) return fail(reply, 404, "No player on this server");

		await player.destroy("stopped by the bot owner", true);
		notifyMusicChange(guildId);

		return send(reply, { ok: true });
	});

	fastify.get("/tasks", async (_req, reply) =>
		send(reply, { tasks: CronManager.getInstance().list(), migrations: await getMigrationStatus() }),
	);

	fastify.post("/tasks/:name/run", async (req, reply) => {
		const name = (req.params as { name: string }).name;
		const manager = CronManager.getInstance();
		if (!manager.list().some(task => task.name === name)) return fail(reply, 404, "Unknown task");

		// Long tasks shouldn't keep the request open, the result shows up in the list and the logs
		void manager.execute(name);

		return send(reply, { started: true });
	});

	fastify.get("/blacklist", async (_req, reply) => {
		const client = useClient();
		const entries = await BlacklistModel.find().sort({ createdAt: -1 }).lean();

		return send(
			reply,
			await Promise.all(
				entries.map(async entry => {
					const name =
						entry.type === "guild"
							? (client.guilds.cache.get(entry.id)?.name ?? null)
							: ((await client.users.fetch(entry.id).catch(() => null))?.username ?? null);

					return {
						type: entry.type,
						id: entry.id,
						name,
						reason: entry.reason,
						createdAt: entry.createdAt.getTime(),
					};
				}),
			),
		);
	});

	fastify.post("/blacklist", async (req, reply) => {
		const body = (req.body ?? {}) as { type?: unknown; id?: unknown; reason?: unknown };
		const type = BLACKLIST_TYPES.find(t => t === body.type);
		const id = typeof body.id === "string" ? body.id.trim() : "";
		const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null;

		if (!type || !/^\d{15,22}$/.test(id)) return fail(reply, 400, "Enter a valid Discord ID");
		if (reason && reason.length > MAX_REASON)
			return fail(reply, 400, `The reason must be up to ${MAX_REASON} characters`);
		if (isOwner(id)) return fail(reply, 400, "You can't blacklist yourself");

		await addToBlacklist(type, id, reason);

		// The bot doesn't stay on a blacklisted server
		if (type === "guild") await useClient().guilds.cache.get(id)?.leave();

		return send(reply, { ok: true });
	});

	fastify.delete("/blacklist/:type/:id", async (req, reply) => {
		const { type, id } = req.params as { type: string; id: string };
		const blacklistType = BLACKLIST_TYPES.find(t => t === type);
		if (!blacklistType) return fail(reply, 400, "Unknown type");

		await removeFromBlacklist(blacklistType, id);

		return send(reply, { ok: true });
	});

	fastify.get("/stats/commands", async (req, reply) => {
		const days = Math.min(Math.max(Number((req.query as { days?: string }).days) || 30, 1), MAX_STATS_DAYS);
		const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
		const docs = await CommandUsageModel.find({ day: { $gte: dayKey(since) } }).lean();

		const byCommand = new Map<string, number>();
		const byDay = new Map<string, number>();

		for (const doc of docs) {
			byCommand.set(doc.command, (byCommand.get(doc.command) ?? 0) + doc.count);
			byDay.set(doc.day, (byDay.get(doc.day) ?? 0) + doc.count);
		}

		// Every day of the range, including the ones without any command
		const daily = Array.from({ length: days }, (_, i) => {
			const day = dayKey(new Date(since.getTime() + i * 24 * 60 * 60 * 1000));
			return { day, count: byDay.get(day) ?? 0 };
		});

		return send(reply, {
			days,
			total: docs.reduce((sum, doc) => sum + doc.count, 0),
			daily,
			commands: [...byCommand.entries()]
				.map(([command, count]) => ({ command, count }))
				.sort((a, b) => b.count - a.count),
		});
	});

	fastify.get("/logs/ws", { websocket: true }, socket => {
		socket.send(JSON.stringify({ type: "history", data: getRecentLogs() }));

		const onLine = (line: unknown) => socket.send(JSON.stringify({ type: "line", data: line }));
		logEvents.on("line", onLine);
		socket.on("close", () => logEvents.off("line", onLine));
	});
}
