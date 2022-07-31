require("./helpers/extenders");

const { GatewayIntentBits } = require("discord.js"),
	JaBa = require("./base/JaBa");

const client = new JaBa({
	intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.MessageContent ],
	allowedMentions: { parse: ["everyone", "roles", "users"] }
});

(async () => {
	client.translations = await require("./helpers/languages")();

	await client.loadEvents("../events");
	await client.loadCommands("../commands");
	await client.init();
})();

client.on("disconnect", () => client.logger.log("Bot is disconnecting...", "warn"))
	.on("reconnecting", () => client.logger.log("Bot reconnecting...", "warn"))
	.on("error", (e) => client.logger.log(e, "error"))
	.on("warn", (info) => client.logger.log(info, "warn"));
process.on("unhandledRejection", (err) => console.error(err));