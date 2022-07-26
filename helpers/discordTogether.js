module.exports.init = function (client) {
	const { DiscordTogether } = require("discord-together");
	client.discordTogether = new DiscordTogether(client);
};