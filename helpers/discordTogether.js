module.exports = {
	init(client) {
		const { DiscordTogether } = require("discord-together");
		client.discordTogether = new DiscordTogether(client);
	}
};