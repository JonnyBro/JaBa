import useClient from "@/utils/use-client.js";
import { model, Schema } from "mongoose";
import { RainlinkTrack } from "rainlink";

const client = useClient();

export interface GuildReconnectInfo {
	status: boolean;
	text: string | null;
	voice: string | null;
	queue: RainlinkTrack[];
}

export interface GuildPlugins {
	birthdays: string | null;
	welcome: {
		enabled: boolean;
		message: string | null;
		channel: string | null;
	};
	goodbye: {
		enabled: boolean;
		message: string | null;
		channel: string | null;
	};
	music: {
		autoPlay: boolean;
	};
}

export interface IGuildSchema {
	id: string;
	language: string;
	plugins: GuildPlugins;
	reconnect: GuildReconnectInfo;
}

const welcomeGoodbyeSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		message: { type: String, default: null },
		channel: { type: String, default: null },
	},
	{ _id: false },
);

const musicSchema = new Schema(
	{
		autoPlay: { type: Boolean, default: false },
	},
	{ _id: false },
);

const pluginsSchema = new Schema(
	{
		birthdays: { type: String, default: null },
		welcome: { type: welcomeGoodbyeSchema, default: () => ({}) },
		goodbye: { type: welcomeGoodbyeSchema, default: () => ({}) },
		music: { type: musicSchema, default: () => ({}) },
	},
	{ _id: false },
);

const reconnectSchema = new Schema(
	{
		status: { type: Boolean, default: false },
		text: { type: String, default: null },
		voice: { type: String, default: null },
		queue: { type: [Object], default: [] },
	},
	{ _id: false },
);

const guildSchema = new Schema<IGuildSchema>({
	id: { type: String, required: true },
	language: {
		type: String,
		default: () => client.configService.get<string>("defaultLang"),
	},
	plugins: { type: pluginsSchema, default: () => ({}) },
	reconnect: { type: reconnectSchema, default: () => ({}) },
});

guildSchema.pre("validate", function (next) {
	const defaultLang = client.configService.get<string>("defaultLang");

	if (typeof this.language !== "string") {
		this.language = defaultLang;
	}

	this.reconnect = {
		status: typeof this.reconnect?.status === "boolean" ? this.reconnect.status : false,
		text: typeof this.reconnect?.text === "string" ? this.reconnect.text : null,
		voice: typeof this.reconnect?.voice === "string" ? this.reconnect.voice : null,
		queue: Array.isArray(this.reconnect?.queue) ? this.reconnect.queue : [],
	};

	this.plugins = {
		birthdays: typeof this.plugins?.birthdays === "string" ? this.plugins.birthdays : null,
		welcome: {
			enabled: !!this.plugins?.welcome?.enabled,
			message:
				typeof this.plugins?.welcome?.message === "string"
					? this.plugins.welcome.message
					: null,
			channel:
				typeof this.plugins?.welcome?.channel === "string"
					? this.plugins.welcome.channel
					: null,
		},
		goodbye: {
			enabled: !!this.plugins?.goodbye?.enabled,
			message:
				typeof this.plugins?.goodbye?.message === "string"
					? this.plugins.goodbye.message
					: null,
			channel:
				typeof this.plugins?.goodbye?.channel === "string"
					? this.plugins.goodbye.channel
					: null,
		},
		music: {
			autoPlay: !!this.plugins?.music?.autoPlay,
		},
	};

	next();
});

export default model<IGuildSchema>("Guild", guildSchema);
