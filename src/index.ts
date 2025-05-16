import { ExtendedClient } from "./structures/client.js";
import logger from "./helpers/logger.js";
import { CLIENT_INTENTS, CLIENT_PARTIALS, CLIENT_ALLOWED_MENTIONS } from "./constants/index.js";

const client = new ExtendedClient({
	intents: CLIENT_INTENTS,
	partials: CLIENT_PARTIALS,
	allowedMentions: CLIENT_ALLOWED_MENTIONS,
});

client.init();

client
	.on("disconnect", () => logger.warn("Bot disconnected."))
	.on("reconnecting", () => logger.warn("Bot is reconnecting..."))
	.on("warn", logger.warn)
	.on("error", logger.error);

process.on("unhandledRejection", logger.error).on("uncaughtException", logger.error);
