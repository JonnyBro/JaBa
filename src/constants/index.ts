import path from "node:path";
import { GatewayIntentBits, MessageMentionOptions, Partials } from "discord.js";
import { AsyncLocalStorage } from "node:async_hooks";
import { ExtendedClient } from "@/structures/client.js";

export const PROJECT_ROOT = path.join(import.meta.dirname, "..");
export const CONFIG_PATH = path.join(PROJECT_ROOT, "..", "config.json");
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
export const CLIENT_ALLOWED_MENTIONS: MessageMentionOptions = { parse: ["everyone", "roles", "users"] };
export const SUPER_CONTEXT = new AsyncLocalStorage<ExtendedClient>();
