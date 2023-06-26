require("./helpers/extenders");

const { GatewayIntentBits } = require("discord.js"),
	JaBa = require("./base/JaBa");

const client = new JaBa({
	intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions ],
	allowedMentions: { parse: ["everyone", "roles", "users"] },
});

(async () => {
	client.translations = await require("./helpers/languages")();

	await client.loadEvents("../events");
	await client.loadCommands("../commands");
	await client.init();
	console.time("botReady");
})();

client.on("disconnect", () => client.logger.log("Bot is disconnecting...", "warn"))
	.on("reconnecting", () => client.logger.log("Bot reconnecting...", "warn"))
	.on("warn", warn => client.logger.log(warn, "warn"))
	.on("error", e => client.logger.log(`${e.message}\n${e.stack}`, "error"));
process.on("unhandledRejection", e => console.log(e));
process.on("uncaughtException", e => console.log(e));