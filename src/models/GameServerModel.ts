import { model, Schema } from "mongoose";

export const GAME_SERVER_FIELDS = [
	"name",
	"map",
	"players",
	"playerList",
	"bots",
	"password",
	"version",
	"ping",
	"address",
] as const;
export type GameServerField = (typeof GAME_SERVER_FIELDS)[number];

export const RAW_FIELD_PREFIX = "raw.";

export interface GameServerFieldEntry {
	/** One of GAME_SERVER_FIELDS or "raw.<path>" for game-specific data */
	key: string;
	/** Null uses the default label */
	label: string | null;
	/** Inline fields next to each other share one line */
	inline: boolean;
}

export interface GameServerState {
	name: string;
	map: string;
	numplayers: number;
	maxplayers: number;
	players: string[];
	bots: number;
	password: boolean;
	version: string;
	ping: number;
	connect: string;
	/** Game-specific data flattened to paths, a list since MongoDB doesn't like dots in keys */
	raw: { key: string; value: string }[];
}

export interface IGameServer {
	guildId: string;
	/** gamedig game id */
	game: string;
	host: string;
	port: number;
	title: string | null;
	/** Extra text from the admins, shown under the status */
	description: string | null;
	channelId: string;
	messageId: string | null;
	fields: GameServerFieldEntry[];
	connectButton: boolean;
	copyButton: boolean;
	/** Minutes between queries */
	interval: number;
	lastCheck: Date | null;
	state: GameServerState | null;
	online: boolean;
	/** Failed queries in a row, the server shows as offline after a few */
	failures: number;
	lastOnline: Date | null;
	/** What the status message was last rendered from, to skip edits when nothing changed */
	renderHash: string | null;
	createdAt: Date;
}

const fieldSchema = new Schema<GameServerFieldEntry>(
	{
		key: { type: String, required: true },
		label: { type: String, default: null },
		inline: { type: Boolean, default: false },
	},
	{ _id: false },
);

const gameServerSchema = new Schema<IGameServer>({
	guildId: { type: String, required: true, index: true },
	game: { type: String, required: true },
	host: { type: String, required: true },
	port: { type: Number, required: true },
	title: { type: String, default: null },
	description: { type: String, default: null },
	channelId: { type: String, required: true },
	messageId: { type: String, default: null },
	fields: { type: [fieldSchema], default: [] },
	connectButton: { type: Boolean, default: true },
	copyButton: { type: Boolean, default: true },
	interval: { type: Number, default: 1, min: 1, max: 30 },
	lastCheck: { type: Date, default: null },
	state: { type: Schema.Types.Mixed, default: null },
	online: { type: Boolean, default: false },
	failures: { type: Number, default: 0 },
	lastOnline: { type: Date, default: null },
	renderHash: { type: String, default: null },
	createdAt: { type: Date, default: Date.now },
});

export default model<IGameServer>("GameServer", gameServerSchema);
