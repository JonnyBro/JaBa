import { CLIENT_ALLOWED_MENTIONS, CLIENT_INTENTS, CLIENT_PARTIALS } from "@/constants/index.js";
import logger from "@/helpers/logger.js";
import { ExtendedClient } from "@/structures/client.js";

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
