// import "./helpers/extenders.js";

// import { GatewayIntentBits } from "discord.js";
// import JaBaClient from "./base/Client.js";
// import languages from "./helpers/languages.js";

import { GatewayIntentBits } from "discord.js";
import { ExtendedClient } from "./structures/client.js";

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

// const client = new JaBaClient({
// 	intents: [
// 		GatewayIntentBits.Guilds,
// 		GatewayIntentBits.GuildMembers,
// 		GatewayIntentBits.GuildModeration,
// 		GatewayIntentBits.GuildEmojisAndStickers,
// 		GatewayIntentBits.GuildIntegrations,
// 		GatewayIntentBits.GuildInvites,
// 		GatewayIntentBits.GuildVoiceStates,
// 		GatewayIntentBits.GuildPresences,
// 		GatewayIntentBits.GuildMessages,
// 		GatewayIntentBits.GuildMessageReactions,
// 		GatewayIntentBits.GuildMessageTyping,
// 		GatewayIntentBits.MessageContent,
// 		GatewayIntentBits.DirectMessageTyping,
// 		GatewayIntentBits.DirectMessages,
// 		GatewayIntentBits.DirectMessageReactions,
// 	],
// 	allowedMentions: { parse: ["everyone", "roles", "users"] },
// });

// (async () => {
// 	console.time("botReady");

// 	client.translations = await languages();

// 	await client.loadEvents("../events");
// 	await client.loadCommands("../commands");
// 	await client.init();
// })();

// client
// 	.on("disconnect", () => client.logger.warn("Bot disconnected."))
// 	.on("reconnecting", () => client.logger.warn("Bot reconnecting..."))
// 	.on("warn", console.log)
// 	.on("error", console.log);

// process.on("unhandledRejection", e => console.log(e)).on("uncaughtException", e => console.log(e));
