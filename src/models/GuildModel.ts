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

const guildSchema = new Schema<IGuildSchema>({
	id: { type: String, required: true },
	language: {
		type: String,
		default: client.configService.get<string>("defaultLang"),
	},
	plugins: {
		type: Object,
		default: {
			birthdays: null,
			welcome: {
				enabled: false,
				message: null,
				channel: null,
			},
			goodbye: {
				enabled: false,
				message: null,
				channel: null,
			},
			music: {
				autoPlay: false,
			},
		},
	},
	reconnect: {
		type: Object,
		default: {
			status: false,
			text: null,
			voice: null,
			queue: [],
		},
	},
});

guildSchema.pre("save", function (next) {
	if (typeof this.language !== "string") {
		this.language = client.configService.get<string>("defaultLang");
	}

	if (!this.plugins || typeof this.plugins !== "object") {
		this.plugins = {
			birthdays: null,
			welcome: {
				enabled: false,
				message: null,
				channel: null,
			},
			goodbye: {
				enabled: false,
				message: null,
				channel: null,
			},
			music: {
				autoPlay: false,
			},
		};
	} else {
		if (!this.plugins.birthdays || typeof this.plugins.birthdays !== "string") {
			this.plugins.birthdays = null;
		}

		if (!this.plugins.welcome || typeof this.plugins.welcome !== "object") {
			this.plugins.welcome = {
				enabled: false,
				message: null,
				channel: null,
			};
		} else {
			this.plugins.welcome = {
				enabled:
					typeof this.plugins.welcome.enabled === "boolean"
						? this.plugins.welcome.enabled
						: false,
				message:
					typeof this.plugins.welcome.message === "string"
						? this.plugins.welcome.message
						: null,
				channel:
					typeof this.plugins.welcome.channel === "string"
						? this.plugins.welcome.channel
						: null,
			};
		}

		if (!this.plugins.goodbye || typeof this.plugins.goodbye !== "object") {
			this.plugins.goodbye = {
				enabled: false,
				message: null,
				channel: null,
			};
		} else {
			this.plugins.goodbye = {
				enabled:
					typeof this.plugins.goodbye.enabled === "boolean"
						? this.plugins.goodbye.enabled
						: false,
				message:
					typeof this.plugins.goodbye.message === "string"
						? this.plugins.goodbye.message
						: null,
				channel:
					typeof this.plugins.goodbye.channel === "string"
						? this.plugins.goodbye.channel
						: null,
			};
		}

		if (!this.plugins.music || typeof this.plugins.music !== "object") {
			this.plugins.music = {
				autoPlay: false,
			};
		} else {
			this.plugins.music = {
				autoPlay:
					typeof this.plugins.music.autoPlay === "boolean"
						? this.plugins.music.autoPlay
						: false,
			};
		}
	}

	if (!this.reconnect || typeof this.reconnect !== "object") {
		this.reconnect = {
			status: false,
			text: null,
			voice: null,
			queue: [],
		};
	} else {
		this.reconnect = {
			status: typeof this.reconnect.status === "boolean" ? this.reconnect.status : false,
			text: typeof this.reconnect.text === "string" ? this.reconnect.text : null,
			voice: typeof this.reconnect.voice === "string" ? this.reconnect.voice : null,
			queue: Array.isArray(this.reconnect.queue) ? this.reconnect.queue : [],
		};
	}

	next();
});

export default model<IGuildSchema>("Guild", guildSchema);
