import { deleteHistory, drawHistory, getHistory, isHistoryRange } from "@/helpers/game-server-history.js";
import {
	addServer,
	checkHost,
	checkServer,
	deleteStatus,
	GAME_LIST,
	getGame,
	isValidFieldKey,
	isValidHost,
	isValidInterval,
	MAX_DESCRIPTION,
	MAX_INTERVAL,
	MAX_SERVERS,
	MIN_INTERVAL,
	publishStatus,
	QueryError,
	queryServer,
	renderStatus,
	ServerInput,
} from "@/helpers/game-servers.js";
import GameServerModel, { GameServerFieldEntry, GameServerState, IGameServer } from "@/models/GameServerModel.js";
import { Guild } from "discord.js";
import { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { fail, send } from "../../utils.js";

const MAX_FIELDS = 20;
const MAX_LABEL = 50;
const MAX_TITLE = 100;
const TEST_COOLDOWN = 2000;

const HOST_ERRORS = {
	NOT_FOUND: "Couldn't find that address",
	PRIVATE: "Local and private addresses can't be monitored",
};

/** Tests send real packets, so one server can't fire them nonstop */
const lastTest = new Map<string, number>();

type StoredServer = IGameServer & { _id: Types.ObjectId };

const serialize = (guild: Guild, server: StoredServer) => ({
	id: server._id.toString(),
	game: server.game,
	gameName: getGame(server.game)?.name ?? server.game,
	host: server.host,
	port: server.port,
	title: server.title,
	description: server.description ?? null,
	channelId: server.channelId,
	fields: server.fields.map(({ key, label, inline }) => ({ key, label, inline: !!inline })),
	connectButton: server.connectButton,
	copyButton: server.copyButton ?? true,
	graph: server.graph ?? true,
	interval: server.interval ?? MIN_INTERVAL,
	state: server.state,
	online: server.online,
	lastOnline: server.lastOnline?.getTime() ?? null,
	messageUrl: server.messageId
		? `https://discord.com/channels/${guild.id}/${server.channelId}/${server.messageId}`
		: null,
});

const parseFields = (value: unknown): GameServerFieldEntry[] | null => {
	if (!Array.isArray(value) || value.length > MAX_FIELDS) return null;

	const fields: GameServerFieldEntry[] = [];
	for (const item of value as { key?: unknown; label?: unknown; inline?: unknown }[]) {
		if (typeof item?.key !== "string" || !isValidFieldKey(item.key)) return null;
		if (fields.some(field => field.key === item.key)) continue;

		const label = typeof item.label === "string" ? item.label.trim().slice(0, MAX_LABEL) : "";
		fields.push({ key: item.key, label: label || null, inline: item.inline === true });
	}

	return fields;
};

// The preview gets the state back from the browser, so it's rebuilt instead of trusted
const parseState = (value: unknown): GameServerState | null => {
	if (!value || typeof value !== "object") return null;

	const state = value as Record<string, unknown>;
	const text = (item: unknown) => (typeof item === "string" ? item.slice(0, 500) : "");
	const number = (item: unknown) => (typeof item === "number" && Number.isFinite(item) ? item : 0);
	const list = (item: unknown) => (Array.isArray(item) ? (item as unknown[]) : []);

	return {
		name: text(state.name),
		map: text(state.map),
		numplayers: number(state.numplayers),
		maxplayers: number(state.maxplayers),
		players: list(state.players)
			.filter((name): name is string => typeof name === "string")
			.slice(0, 200),
		bots: number(state.bots),
		password: state.password === true,
		version: text(state.version),
		ping: number(state.ping),
		connect: text(state.connect),
		raw: list(state.raw)
			.map(entry => entry as { key?: unknown; value?: unknown })
			.filter(entry => typeof entry?.key === "string" && typeof entry.value === "string")
			.slice(0, 100)
			.map(entry => ({ key: entry.key as string, value: entry.value as string })),
	};
};

const parseDescription = (value: unknown) =>
	typeof value === "string" ? value.trim().slice(0, MAX_DESCRIPTION) || null : null;

const parseTarget = (body: Record<string, unknown>) => {
	const game = typeof body.game === "string" && getGame(body.game) ? body.game : null;
	const host = typeof body.host === "string" ? body.host.trim().toLowerCase() : "";
	const port = Number(body.port);

	if (!game) return { error: "Unknown game" };
	if (!isValidHost(host)) return { error: "That doesn't look like a server address" };
	if (!Number.isInteger(port) || port < 1 || port > 65535) return { error: "The port must be from 1 to 65535" };

	return { target: { game, host, port } };
};

const parseInput = (guild: Guild, body: Record<string, unknown>): { error: string } | { input: ServerInput } => {
	const parsed = parseTarget(body);
	if (parsed.error !== undefined) return { error: parsed.error };

	const channel = getSendableChannel(guild, body.channelId);
	if (!channel) return { error: "The bot can't post in that channel" };

	const fields = parseFields(body.fields);
	if (!fields) return { error: `Pick up to ${MAX_FIELDS} fields` };

	if (!isValidInterval(body.interval))
		return { error: `Checks can run every ${MIN_INTERVAL} to ${MAX_INTERVAL} minutes` };

	const title = typeof body.title === "string" ? body.title.trim().slice(0, MAX_TITLE) : "";

	return {
		input: {
			...parsed.target!,
			channelId: channel.id,
			title: title || null,
			description: parseDescription(body.description),
			fields,
			connectButton: body.connectButton === true,
			copyButton: body.copyButton === true,
			graph: body.graph === true,
			interval: body.interval,
		},
	};
};

const findServer = (guildId: string, id: string) =>
	Types.ObjectId.isValid(id) ? GameServerModel.findOne({ _id: id, guildId }).lean<StoredServer>() : null;

export default async function gameServersRoutes(fastify: FastifyInstance) {
	fastify.get("/gameservers", async (req, reply) => {
		const servers = await GameServerModel.find({ guildId: req.guild.id })
			.sort({ createdAt: 1 })
			.lean<StoredServer[]>();

		return send(reply, {
			servers: servers.map(server => serialize(req.guild, server)),
			max: MAX_SERVERS,
			games: GAME_LIST,
		});
	});

	fastify.post("/gameservers/test", async (req, reply) => {
		const parsed = parseTarget((req.body ?? {}) as Record<string, unknown>);
		if (parsed.error !== undefined) return fail(reply, 400, parsed.error);

		const now = Date.now();
		if (now - (lastTest.get(req.guild.id) ?? 0) < TEST_COOLDOWN) return fail(reply, 429, "Wait a moment");
		lastTest.set(req.guild.id, now);

		const state = await queryServer(parsed.target!).catch((error: unknown) =>
			error instanceof QueryError ? error.reason : "NO_RESPONSE",
		);

		return send(reply, typeof state === "string" ? { ok: false, reason: state } : { ok: true, state });
	});

	fastify.post("/gameservers/preview", async (req, reply) => {
		const body = (req.body ?? {}) as Record<string, unknown>;
		const parsed = parseTarget(body);
		if (parsed.error !== undefined) return fail(reply, 400, parsed.error);

		const fields = parseFields(body.fields);
		if (!fields) return fail(reply, 400, `Pick up to ${MAX_FIELDS} fields`);

		const state = parseState(body.state);
		const title = typeof body.title === "string" ? body.title.trim().slice(0, MAX_TITLE) : "";
		// An existing server shows its real graph, a new one has no history yet
		const existing = typeof body.serverId === "string" ? await findServer(req.guild.id, body.serverId) : null;

		const rendered = await renderStatus(req.guild, {
			...parsed.target!,
			_id: existing?._id,
			title: title || null,
			description: parseDescription(body.description),
			fields,
			connectButton: body.connectButton === true,
			copyButton: body.copyButton === true,
			graph: body.graph === true,
			interval: isValidInterval(body.interval) ? body.interval : MIN_INTERVAL,
			state,
			online: !!state,
			lastOnline: typeof body.lastOnline === "number" ? new Date(body.lastOnline) : null,
		});

		return send(reply, {
			...rendered,
			graph: rendered.graph && {
				image: `data:image/png;base64,${drawHistory(rendered.graph.points).toString("base64")}`,
				caption: rendered.graph.caption,
			},
		});
	});

	fastify.post("/gameservers", async (req, reply) => {
		const parsed = parseInput(req.guild, (req.body ?? {}) as Record<string, unknown>);
		if ("error" in parsed) return fail(reply, 400, parsed.error);

		const result = await addServer(req.guild, parsed.input);
		if ("error" in result) {
			if (result.error === "LIMIT") return fail(reply, 400, `Up to ${MAX_SERVERS} game servers per server`);
			if (result.error === "EXISTS") return fail(reply, 400, "This game server is already monitored");

			return fail(reply, 400, HOST_ERRORS[result.error]);
		}

		const { server } = result;
		await logAction(req, req.guild.id, {
			action: "gameservers.add",
			target: { id: server._id.toString(), name: `${server.host}:${server.port}` },
			details: { after: parsed.input },
		});

		return send(reply, serialize(req.guild, server), 201);
	});

	fastify.get("/gameservers/:serverId/history", async (req, reply) => {
		const server = await findServer(req.guild.id, (req.params as { serverId: string }).serverId);
		if (!server) return fail(reply, 404, "Game server not found");

		const { range } = req.query as { range?: unknown };
		if (!isHistoryRange(range)) return fail(reply, 400, "Unknown range");

		return send(reply, { range, points: await getHistory(server._id, range) });
	});

	fastify.put("/gameservers/:serverId", async (req, reply) => {
		const guild = req.guild;
		const server = await findServer(guild.id, (req.params as { serverId: string }).serverId);
		if (!server) return fail(reply, 404, "Game server not found");

		const parsed = parseInput(guild, (req.body ?? {}) as Record<string, unknown>);
		if ("error" in parsed) return fail(reply, 400, parsed.error);

		const { input } = parsed;
		const targetChanged = input.game !== server.game || input.host !== server.host || input.port !== server.port;

		if (targetChanged) {
			const duplicate = await GameServerModel.exists({
				guildId: guild.id,
				host: input.host,
				port: input.port,
				_id: { $ne: server._id },
			});
			if (duplicate) return fail(reply, 400, "This game server is already monitored");

			const hostError = await checkHost(input);
			if (hostError) return fail(reply, 400, HOST_ERRORS[hostError]);
		}

		if (input.channelId !== server.channelId) await deleteStatus(guild, server);
		if (targetChanged) await deleteHistory(server._id);

		const update: Partial<IGameServer> = {
			...input,
			...(input.channelId !== server.channelId && { messageId: null }),
			...(targetChanged && { state: null, online: false, failures: 0, lastOnline: null }),
			renderHash: null,
		};
		await GameServerModel.updateOne({ _id: server._id }, { $set: update });

		const updated = { ...server, ...update };
		if (targetChanged) await checkServer(updated);
		else {
			const published = await publishStatus(guild, updated);
			await GameServerModel.updateOne({ _id: server._id }, { $set: published });
		}

		const before = {
			game: server.game,
			host: server.host,
			port: server.port,
			channelId: server.channelId,
			interval: server.interval,
		};
		await logAction(req, guild.id, {
			action: "gameservers.update",
			target: { id: server._id.toString(), name: `${input.host}:${input.port}` },
			details: { before, after: input },
		});

		return send(reply, serialize(guild, (await findServer(guild.id, server._id.toString()))!));
	});

	fastify.delete("/gameservers/:serverId", async (req, reply) => {
		const server = await findServer(req.guild.id, (req.params as { serverId: string }).serverId);
		if (!server) return fail(reply, 404, "Game server not found");

		await GameServerModel.deleteOne({ _id: server._id });
		await deleteStatus(req.guild, server);
		await deleteHistory(server._id);

		await logAction(req, req.guild.id, {
			action: "gameservers.remove",
			target: { id: server._id.toString(), name: `${server.host}:${server.port}` },
		});

		return send(reply, { ok: true });
	});
}
