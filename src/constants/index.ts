import { ExtendedClient } from "@/structures/client.js";
import { GatewayIntentBits, MessageMentionOptions, Partials } from "discord.js";
import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";

export const PROJECT_ROOT = path.join(import.meta.dirname, "..");
export const IS_PROD = process.env.PROD === "true" ? true : false;
export const CLIENT_INTENTS = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildModeration,
	GatewayIntentBits.GuildExpressions,
	GatewayIntentBits.GuildIntegrations,
	GatewayIntentBits.GuildInvites,
	GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.GuildPresences,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.GuildMessageTyping,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.DirectMessageTyping,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.DirectMessageReactions,
];
export const CLIENT_PARTIALS: Array<Partials> = [Partials.Channel];
export const CLIENT_ALLOWED_MENTIONS: MessageMentionOptions = {
	parse: ["everyone", "roles", "users"],
};
export const SUPER_CONTEXT = new AsyncLocalStorage<ExtendedClient>();
