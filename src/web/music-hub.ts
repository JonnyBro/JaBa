import { musicEvents } from "@/helpers/music-events.js";
import useClient from "@/utils/use-client.js";
import type { WebSocket } from "@fastify/websocket";
import { LavalinkManagerEvents } from "lavalink-client";
import { getMusicState } from "./music-state.js";

type Subscriber = { socket: WebSocket; userId: string };

// Events often come in bursts (skip = trackEnd + trackStart + queue change), so they are merged
const BROADCAST_DELAY = 200;
const PING_INTERVAL = 30_000;

const PLAYER_EVENTS: (keyof LavalinkManagerEvents)[] = [
	"trackStart",
	"trackEnd",
	"queueEnd",
	"playerCreate",
	"playerDestroy",
	"playerUpdate",
	"playerClientUpdate",
	"playerMove",
	"playerDisconnect",
	"playerReconnect",
];

const subscribers = new Map<string, Set<Subscriber>>();
const pending = new Map<string, ReturnType<typeof setTimeout>>();

const sendState = (guildId: string, subscriber: Subscriber) => {
	const guild = useClient().guilds.cache.get(guildId);
	if (!guild || subscriber.socket.readyState !== subscriber.socket.OPEN) return;

	subscriber.socket.send(JSON.stringify({ type: "state", data: getMusicState(guild, subscriber.userId) }));
};

export const scheduleBroadcast = (guildId: string) => {
	if (!subscribers.get(guildId)?.size || pending.has(guildId)) return;

	pending.set(
		guildId,
		setTimeout(() => {
			pending.delete(guildId);
			subscribers.get(guildId)?.forEach(subscriber => sendState(guildId, subscriber));
		}, BROADCAST_DELAY),
	);
};

export const subscribe = (guildId: string, subscriber: Subscriber) => {
	if (!subscribers.has(guildId)) subscribers.set(guildId, new Set());
	subscribers.get(guildId)!.add(subscriber);

	const ping = setInterval(() => subscriber.socket.ping(), PING_INTERVAL);

	subscriber.socket.on("close", () => {
		clearInterval(ping);
		subscribers.get(guildId)?.delete(subscriber);
		if (!subscribers.get(guildId)?.size) subscribers.delete(guildId);
	});

	sendState(guildId, subscriber);
};

export const initMusicHub = () => {
	const client = useClient();

	musicEvents.on("change", scheduleBroadcast);

	for (const event of PLAYER_EVENTS)
		client.lavalink.on(event, (...args: unknown[]) => {
			const source = args.find(arg => typeof (arg as { guildId?: unknown })?.guildId === "string");
			if (source) scheduleBroadcast((source as { guildId: string }).guildId);
		});

	// Joining or leaving the player's channel changes who can control it
	client.on("voiceStateUpdate", (_old, state) => scheduleBroadcast(state.guild.id));
};
