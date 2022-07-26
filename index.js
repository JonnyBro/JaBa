require("./helpers/extenders");

const { Intents } = require("discord.js"),
	JaBa = require("./base/JaBa");

const client = new JaBa({
	intents: Object.keys(Intents.FLAGS),
	allowedMentions: { parse: ["everyone", "roles", "users"] }
});

(async () => {
	client.translations = await require("./helpers/languages")();

	await client.loadEvents("../events");
	await client.loadCommands("../commands");
	await client.init();
})();

client.on("disconnect", () => client.logger.log("Bot is disconnecting...", "warn"))
	.on("reconnecting", () => client.logger.log("Bot reconnecting...", "log"))
	.on("error", (e) => client.logger.log(e, "error"))
	.on("warn", (info) => client.logger.log(info, "warn"));
process.on("unhandledRejection", (err) => console.error(err));