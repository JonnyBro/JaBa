require("./helpers/extenders");

const { GatewayIntentBits } = require("discord.js"),
	Client = require("./base/Client");

const client = new Client({
	intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions ],
	allowedMentions: { parse: ["everyone", "roles", "users"] },
});

(async () => {
	console.time("botReady");

	client.translations = await require("./helpers/languages")();

	await client.loadEvents("../events");
	await client.loadCommands("../commands");
	await client.init();
})();

client
	.on("disconnect", () => client.logger.warn("Bot is disconnecting..."))
	.on("reconnecting", () => client.logger.warn("Bot reconnecting..."))
	.on("warn", warn => client.logger.warn(warn))
	.on("error", e => client.logger.error(`${e.message}\n${e.stack}`));

process
	.on("unhandledRejection", e => console.log(e))
	.on("uncaughtException", e => console.log(e));