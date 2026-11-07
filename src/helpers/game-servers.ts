import { translateContext } from "@/helpers/functions.js";
import {
	drawHistory,
	getHistory,
	hasHistory,
	historyPeak,
	HistoryPoint,
	recordSample,
} from "@/helpers/game-server-history.js";
import logger from "@/helpers/logger.js";
import GameServerModel, {
	GAME_SERVER_FIELDS,
	GameServerField,
	GameServerFieldEntry,
	GameServerState,
	IGameServer,
	RAW_FIELD_PREFIX,
} from "@/models/GameServerModel.js";
import { componentRouter } from "@/utils/component-router.js";
import { containerMessage, createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	DiscordAPIError,
	escapeMarkdown,
	Guild,
	GuildTextBasedChannel,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	RESTJSONErrorCodes,
} from "discord.js";
import { GameDig, games, QueryResult } from "gamedig";
import { createHash } from "node:crypto";
import { lookup, resolveSrv } from "node:dns/promises";
import { Types } from "mongoose";
import { BlockList, isIP } from "node:net";

export const MAX_SERVERS = 10;
export const MIN_INTERVAL = 1;
export const MAX_INTERVAL = 30;
export const MAX_DESCRIPTION = 1000;
/** Roughly how long a server stays silent before it shows as offline */
const OFFLINE_AFTER_MINUTES = 3;
/** The task runs every minute and a check takes a few seconds, so "due" is a bit early on purpose */
const DUE_SLACK = 15_000;
const QUERY_CONCURRENCY = 5;
const MAX_LIST_PLAYERS = 30;
const MAX_RAW_FIELDS = 60;
const MAX_RAW_VALUE = 200;
const MAX_RAW_DEPTH = 3;

const COPY_ID = "gameserver_copy";
const GRAPH_FILE = "online.png";

const COLORS = { online: "#57F287", offline: "#ED4245" } as const;

export const DEFAULT_FIELDS: GameServerFieldEntry[] = ["name", "map", "players", "playerList", "address"].map(key => ({
	key,
	label: null,
	inline: false,
}));

export const isValidInterval = (value: unknown): value is number =>
	Number.isInteger(value) && (value as number) >= MIN_INTERVAL && (value as number) <= MAX_INTERVAL;

// lean() skips schema defaults, servers saved before the setting existed have no interval
const getInterval = (server: { interval?: number }) => server.interval ?? MIN_INTERVAL;

export type ServerTarget = Pick<IGameServer, "game" | "host" | "port">;
export type ServerView = ServerTarget &
	Pick<IGameServer, "title" | "fields" | "connectButton" | "state" | "online" | "lastOnline"> &
	Partial<Pick<IGameServer, "interval" | "description" | "copyButton" | "graph">> & { _id?: unknown };
type PublishedServer = ServerView & Pick<IGameServer, "channelId" | "messageId" | "renderHash">;

// Games
export const getGame = (id: string) => (Object.hasOwn(games, id) ? games[id] : null);

export const GAME_LIST = Object.entries(games)
	.map(([id, game]) => ({
		id,
		name: game.name,
		port: game.options.port ?? game.options.port_query ?? null,
		steam: game.options.protocol === "valve",
	}))
	.sort((a, b) => a.name.localeCompare(b.name));

export const getDefaultPort = (id: string) => GAME_LIST.find(game => game.id === id)?.port ?? null;

const POPULAR_GAMES = ["garrysmod", "minecraft"];

export const gameAutocomplete = (input: string) => {
	const query = input.trim().toLowerCase();
	const matches = query
		? GAME_LIST.filter(game => game.name.toLowerCase().includes(query) || game.id.includes(query))
		: [...POPULAR_GAMES.map(id => GAME_LIST.find(game => game.id === id)!), ...GAME_LIST];

	return [...new Map(matches.map(game => [game.id, game])).values()]
		.slice(0, 25)
		.map(game => ({ name: game.name.slice(0, 100), value: game.id }));
};

// Steam is the only launcher with a link scheme that joins a server
const isSteamGame = (id: string) => GAME_LIST.find(game => game.id === id)?.steam ?? false;

// Addresses
const HOSTNAME = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/i;

export const isValidHost = (host: string) => host.length <= 253 && (!!isIP(host) || HOSTNAME.test(host));

/** Parses "host", "host:port" and "[ipv6]:port" */
export const parseAddress = (input: string) => {
	const value = input.trim();
	const match = /^\[([0-9a-f:.]+)\](?::(\d{1,5}))?$/i.exec(value) ?? /^([^:\s]+)(?::(\d{1,5}))?$/.exec(value);
	if (!match || !isValidHost(match[1])) return null;

	const port = match[2] ? Number(match[2]) : null;
	if (port !== null && (port < 1 || port > 65535)) return null;

	return { host: match[1].toLowerCase(), port };
};

const PRIVATE_RANGES = new BlockList();
for (const [network, prefix] of [
	["0.0.0.0", 8],
	["10.0.0.0", 8],
	["100.64.0.0", 10],
	["127.0.0.0", 8],
	["169.254.0.0", 16],
	["172.16.0.0", 12],
	["192.0.0.0", 24],
	["192.168.0.0", 16],
	["198.18.0.0", 15],
	["224.0.0.0", 4],
	["240.0.0.0", 4],
] as const)
	PRIVATE_RANGES.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
	["::", 127],
	["fc00::", 7],
	["fe80::", 10],
	["ff00::", 8],
] as const)
	PRIVATE_RANGES.addSubnet(network, prefix, "ipv6");

// No rule for IPv4-mapped IPv6 (::ffff:0:0/96): BlockList already checks those against the IPv4 rules,
// and adding the range would block every IPv4 address
const isPrivate = (address: string) => PRIVATE_RANGES.check(address, isIP(address) === 6 ? "ipv6" : "ipv4");

/**
 * Admins of any server pick the address, so without this the bot could be used to poke at its own network.
 * Minecraft also follows SRV records, their targets get the same check
 */
export const checkHost = async (target: ServerTarget): Promise<"NOT_FOUND" | "PRIVATE" | null> => {
	if (useClient().configService.get<string>("GAME_SERVERS_ALLOW_PRIVATE") === "true") return null;

	const hosts = [target.host];
	if (!isIP(target.host) && getGame(target.game)?.options.protocol.includes("minecraft")) {
		const records = await resolveSrv(`_minecraft._tcp.${target.host}`).catch(() => []);
		hosts.push(...records.map(record => record.name));
	}

	for (const host of hosts) {
		const addresses = isIP(host)
			? [host]
			: (await lookup(host, { all: true }).catch(() => [])).map(entry => entry.address);

		if (!addresses.length) return "NOT_FOUND";
		if (addresses.some(isPrivate)) return "PRIVATE";
	}

	return null;
};

// Querying
const flattenRaw = (value: unknown, prefix = "", out: GameServerState["raw"] = [], depth = 0) => {
	if (!value || typeof value !== "object" || depth > MAX_RAW_DEPTH) return out;

	for (const [key, item] of Object.entries(value)) {
		if (out.length >= MAX_RAW_FIELDS) break;

		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
			const text = String(item).trim();
			if (text) out.push({ key: path, value: text.slice(0, MAX_RAW_VALUE) });
		} else if (!Array.isArray(item)) flattenRaw(item, path, out, depth + 1);
	}

	return out;
};

const playerNames = (players: QueryResult["players"] | undefined) =>
	(players ?? []).map(player => player.name?.trim() ?? "").filter(Boolean);

const toState = (result: QueryResult): GameServerState => ({
	name: result.name ?? "",
	map: result.map ?? "",
	numplayers: (result as QueryResult & { numplayers?: number }).numplayers ?? result.players.length,
	maxplayers: result.maxplayers ?? 0,
	players: playerNames(result.players),
	bots: result.bots?.length ?? 0,
	password: !!result.password,
	version: result.version ?? "",
	ping: result.ping ?? 0,
	connect: result.connect ?? "",
	raw: flattenRaw(result.raw),
});

export class QueryError extends Error {
	constructor(public readonly reason: "NOT_FOUND" | "PRIVATE" | "UNKNOWN_GAME" | "NO_RESPONSE") {
		super(reason);
	}
}

export const queryServer = async (target: ServerTarget) => {
	if (!getGame(target.game)) throw new QueryError("UNKNOWN_GAME");

	const hostError = await checkHost(target);
	if (hostError) throw new QueryError(hostError);

	const result = await GameDig.query({
		type: target.game,
		host: target.host,
		port: target.port,
		socketTimeout: 3000,
		attemptTimeout: 6000,
		maxRetries: 1,
	}).catch(() => null);
	if (!result) throw new QueryError("NO_RESPONSE");

	return toState(result);
};

// Status message
type Translate = (key: string, args?: Record<string, unknown>) => Promise<string>;

const isStandardField = (key: string): key is GameServerField => GAME_SERVER_FIELDS.includes(key as GameServerField);

export const isValidFieldKey = (key: string) =>
	isStandardField(key) || (key.startsWith(RAW_FIELD_PREFIX) && key.length > RAW_FIELD_PREFIX.length);

const formatField = async (key: string, state: GameServerState, t: Translate) => {
	switch (key) {
		case "name":
			return escapeMarkdown(state.name);
		case "map":
			return escapeMarkdown(state.map);
		case "players":
			return `${state.numplayers}/${state.maxplayers}`;
		case "playerList": {
			if (!state.players.length) return null;

			const shown = state.players.slice(0, MAX_LIST_PLAYERS).map(name => escapeMarkdown(name));
			const rest = state.players.length - shown.length;

			return rest > 0 ? `${shown.join(", ")} ${await t("MORE_PLAYERS", { count: rest })}` : shown.join(", ");
		}
		case "bots":
			return state.bots ? String(state.bots) : null;
		case "password":
			return t(state.password ? "YES" : "NO");
		case "version":
			return escapeMarkdown(state.version);
		case "ping":
			return state.ping ? t("PING_VALUE", { ping: state.ping }) : null;
		case "address":
			return state.connect && `\`${state.connect}\``;
	}

	const value = state.raw.find(entry => entry.key === key.slice(RAW_FIELD_PREFIX.length))?.value;

	return value ? escapeMarkdown(value) : null;
};

const fieldLabel = async (entry: GameServerFieldEntry, t: Translate) => {
	if (entry.label?.trim()) return entry.label.trim();

	return isStandardField(entry.key) ? t(`FIELDS:${entry.key}`) : entry.key.slice(RAW_FIELD_PREFIX.length);
};

const connectUrl = (server: ServerView) => {
	const base = useClient().configService.get<string>("DASHBOARD_URL");
	if (!base || !server.connectButton || !server.online || !server.state?.connect || !isSteamGame(server.game))
		return null;

	return `${base.replace(/\/$/, "")}/api/connect/${encodeURIComponent(server.state.connect)}`;
};

/** What players type in the game, the port is left out when it's the game's default */
const playerAddress = (server: ServerTarget & { state: GameServerState | null }) => {
	const address = server.state?.connect || `${server.host}:${server.port}`;
	const port = getDefaultPort(server.game);

	return port && address.endsWith(`:${port}`) ? address.slice(0, -`:${port}`.length) : address;
};

/** `live` is for the message the bot keeps updating, a one-off check doesn't promise updates */
export const renderStatus = async (guild: Guild, server: ServerView, live = true) => {
	const t: Translate = (key, args) => translateContext(guild, `gameservers:${key}`, args);
	const title = escapeMarkdown(server.title?.trim() || server.state?.name || `${server.host}:${server.port}`);
	const lines: string[] = [];

	if (server.online && server.state) {
		lines.push(`## 🟢 ${title}`);

		// Components have no embed fields, so inline ones are joined on one line instead
		let inlineRow = false;
		for (const entry of server.fields) {
			const value = await formatField(entry.key, server.state, t);
			if (!value) continue;

			const line = `**${escapeMarkdown(await fieldLabel(entry, t))}:** ${value}`;
			if (entry.inline && inlineRow) lines[lines.length - 1] += ` · ${line}`;
			else lines.push(line);

			inlineRow = !!entry.inline;
		}
	} else {
		lines.push(`## 🔴 ${title}`);

		if (server.lastOnline) {
			const seconds = Math.floor(new Date(server.lastOnline).getTime() / 1000);
			lines.push(await t("OFFLINE_SINCE", { date: `<t:${seconds}:R>` }));
		} else lines.push(await t("NEVER_ONLINE"));
	}

	// Written by the admins, so markdown and links are kept on purpose
	const description = server.description?.trim();
	if (description) lines.push("", description);

	if (live && server.online && server.state) {
		const interval = getInterval(server);
		lines.push(`-# ${await (interval === 1 ? t("UPDATES") : t("UPDATES_EVERY", { count: interval }))}`);
	}

	const buttons: StatusButton[] = [];

	const url = connectUrl(server);
	if (url) buttons.push({ label: await t("CONNECT"), url });

	// The preview has no id yet, its button is never clicked anyway
	if (live && server.copyButton !== false)
		buttons.push({
			label: await t("COPY_ADDRESS"),
			id: `${COPY_ID}:${server._id ? String(server._id) : "preview"}`,
		});

	let graph: { points: HistoryPoint[]; caption: string } | null = null;
	if (live && server.graph !== false && server._id) {
		const points = await getHistory(String(server._id), "day");
		if (hasHistory(points)) graph = { points, caption: await t("GRAPH_CAPTION", { peak: historyPeak(points) }) };
	}

	return {
		text: lines.join("\n"),
		color: server.online ? COLORS.online : COLORS.offline,
		buttons,
		graph,
	};
};

type StatusButton = { label: string; url?: string; id?: string };

export const toStatusMessage = (rendered: Awaited<ReturnType<typeof renderStatus>>) => {
	const container = createContainer(rendered.color).addTextDisplayComponents(createText(rendered.text));
	const files: AttachmentBuilder[] = [];

	if (rendered.graph) {
		files.push(new AttachmentBuilder(drawHistory(rendered.graph.points), { name: GRAPH_FILE }));
		container
			.addMediaGalleryComponents(
				new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${GRAPH_FILE}`)),
			)
			.addTextDisplayComponents(createText(`-# ${rendered.graph.caption}`));
	}

	if (rendered.buttons.length)
		container.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				rendered.buttons.map(button => {
					const builder = new ButtonBuilder().setLabel(button.label);

					return button.url
						? builder.setStyle(ButtonStyle.Link).setURL(button.url)
						: builder.setStyle(ButtonStyle.Secondary).setCustomId(button.id!);
				}),
			),
		);

	// An empty list drops the old graph on edits, the new one comes in files
	return { ...containerMessage(container), files, attachments: [] };
};

// Only a message that's really gone gets posted again, a network hiccup shouldn't make a duplicate
const fetchStatusMessage = (channel: GuildTextBasedChannel, messageId: string) =>
	channel.messages.fetch(messageId).catch((error: unknown) => {
		if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.UnknownMessage) return null;

		return undefined;
	});

/** Posts the status message or edits it, returns what to store about it */
export const publishStatus = async (guild: Guild, server: PublishedServer) => {
	const unchanged = { messageId: server.messageId, renderHash: server.renderHash };
	const rendered = await renderStatus(guild, server);
	const hash = createHash("sha1").update(JSON.stringify(rendered)).digest("hex");
	if (hash === server.renderHash && server.messageId) return unchanged;

	const channel = guild.channels.cache.get(server.channelId);
	if (!channel?.isTextBased() || !channel.isSendable()) return unchanged;

	const payload = toStatusMessage(rendered);

	const existing = server.messageId ? await fetchStatusMessage(channel, server.messageId) : null;
	if (existing === undefined) return unchanged;

	if (existing) {
		const edited = await existing.edit(payload).catch(error => {
			logger.warn(`[GameServers] Can't edit the status in ${guild.id}:`, error);

			return null;
		});

		return { messageId: existing.id, renderHash: edited ? hash : server.renderHash };
	}

	const sent = await channel.send(payload).catch(() => null);

	return { messageId: sent?.id ?? null, renderHash: sent ? hash : null };
};

export const deleteStatus = async (guild: Guild, server: Pick<IGameServer, "channelId" | "messageId">) => {
	const channel = guild.channels.cache.get(server.channelId);
	if (server.messageId && channel?.isTextBased()) await channel.messages.delete(server.messageId).catch(() => {});
};

// Checks
type StoredServer = PublishedServer & { _id: unknown; guildId: string; failures: number; lastCheck?: Date | null };

export const checkServer = async (server: StoredServer, checkedAt = new Date()) => {
	const guild = useClient().guilds.cache.get(server.guildId);
	if (!guild) return;

	const state = await queryServer(server).catch(() => null);
	const failures = state ? 0 : server.failures + 1;
	const offlineAfter = Math.ceil(OFFLINE_AFTER_MINUTES / getInterval(server));
	const update: Partial<IGameServer> = state
		? { state, online: true, failures, lastOnline: new Date(), lastCheck: checkedAt }
		: { failures, online: server.online && failures < offlineAfter, lastCheck: checkedAt };

	// A single missed answer isn't downtime yet, so it isn't recorded either
	if (state || !update.online) await recordSample(String(server._id), checkedAt, state?.numplayers ?? null);

	const published = await publishStatus(guild, { ...server, ...update });

	await GameServerModel.updateOne({ _id: server._id }, { $set: { ...update, ...published } });
};

const isDue = (server: StoredServer, now: number) =>
	!server.lastCheck || now - new Date(server.lastCheck).getTime() >= getInterval(server) * 60_000 - DUE_SLACK;

export const checkAllServers = async () => {
	const checkedAt = new Date();
	const guildIds = [...useClient().guilds.cache.keys()];
	const servers = (await GameServerModel.find({ guildId: { $in: guildIds } }).lean()).filter(server =>
		isDue(server, checkedAt.getTime()),
	);

	for (let i = 0; i < servers.length; i += QUERY_CONCURRENCY)
		await Promise.all(
			servers
				.slice(i, i + QUERY_CONCURRENCY)
				.map(server =>
					checkServer(server, checkedAt).catch(error =>
						logger.warn(`[GameServers] Can't check ${server.host}:${server.port}:`, error),
					),
				),
		);
};

// Managing
export type ServerInput = ServerTarget &
	Pick<
		IGameServer,
		"channelId" | "title" | "description" | "fields" | "connectButton" | "copyButton" | "graph" | "interval"
	>;

type AddResult =
	{ error: "LIMIT" | "EXISTS" | "NOT_FOUND" | "PRIVATE" } | { server: IGameServer & { _id: Types.ObjectId } };

export const addServer = async (guild: Guild, input: ServerInput): Promise<AddResult> => {
	if ((await GameServerModel.countDocuments({ guildId: guild.id })) >= MAX_SERVERS)
		return { error: "LIMIT" as const };
	if (await GameServerModel.exists({ guildId: guild.id, host: input.host, port: input.port }))
		return { error: "EXISTS" as const };

	const hostError = await checkHost(input);
	if (hostError) return { error: hostError };

	const created = await GameServerModel.create({ ...input, guildId: guild.id });
	await checkServer(created.toObject());

	return { server: (await GameServerModel.findById(created._id).lean<IGameServer & { _id: Types.ObjectId }>())! };
};

// The address goes alone in its own message, so a long press on mobile copies just the address
componentRouter.register(COPY_ID, async interaction => {
	if (!interaction.isButton() || !interaction.inCachedGuild()) return;

	const id = interaction.customId.split(":")[1];
	const server = Types.ObjectId.isValid(id)
		? await GameServerModel.findOne({ _id: id, guildId: interaction.guildId }).lean()
		: null;

	await interaction.reply({
		content: server
			? playerAddress(server)
			: await translateContext(interaction, "administration/gameserver:NOT_FOUND"),
		flags: MessageFlags.Ephemeral,
		allowedMentions: { parse: [] },
	});
});
