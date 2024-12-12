import { GatewayIntentBits } from "discord.js";
import { ExtendedClient } from "./structures/client.js";
import logger from "./helpers/logger.js";

export const client = new ExtendedClient({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
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
	],
	allowedMentions: { parse: ["everyone", "roles", "users"] },
});

client.init();

client
	.on("disconnect", () => logger.warn("Bot disconnected."))
	.on("reconnecting", () => logger.warn("Bot reconnecting..."))
	.on("warn", console.log)
	.on("error", console.log);

process.on("unhandledRejection", console.log).on("uncaughtException", console.log);
