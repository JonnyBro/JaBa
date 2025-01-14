import { ExtendedClient } from "./structures/client.js";
import logger from "./helpers/logger.js";
import { CLIENT_INTENTS, CLIENT_ALLOWED_MENTIONS } from "./constants/index.js";
import { Partials } from "discord.js";

const client = new ExtendedClient({
	intents: CLIENT_INTENTS,
	partials: [Partials.Channel],
	allowedMentions: CLIENT_ALLOWED_MENTIONS,
});

client.init();

client
	.on("disconnect", () => logger.warn("Bot disconnected."))
	.on("reconnecting", () => logger.warn("Bot reconnecting..."))
	.on("warn", logger.log)
	.on("error", logger.log);

process.on("unhandledRejection", logger.log).on("uncaughtException", logger.log);
