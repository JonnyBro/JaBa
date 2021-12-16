const chalk = require("chalk");

module.exports = class {
	constructor (client) {
		this.client = client;
	}

	async run () {
		const client = this.client;

		// Logs some informations using logger
		client.logger.log(`Loading a total of ${client.commands.size} command(s).`, "log");
		client.logger.log(`${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.filter(guild => guild.id != "568120814776614924" && guild.id != "892727526911258654").size} servers.`, "ready");

		// Discord Together
		const discordtogether = require("../helpers/discordTogether");
		discordtogether.init(client);

		// DiscordBots.org STATS
		const discordbotsorg = require("../helpers/discordbots.org");
		discordbotsorg.init(client);

		// UNMUTE USERS
		const checkUnmutes = require("../helpers/checkUnmutes");
		checkUnmutes.init(client);

		// SEND REMINDS
		const checkReminds = require("../helpers/checkReminds");
		checkReminds.init(client);

		// DAILY SHOP FORTNITE
		const fortniteShop = require("../helpers/fortniteShop");
		fortniteShop.init(client);

		// Start the dashboard
		if (client.config.dashboard.enabled) client.dashboard.load(client);

		// Update status every 20s
		const status = [
			{ name: `{servers} сервер(а/ов)`, type: "WATCHING" },
			{ name: "help", type: "WATCHING" }
		];
		const version = require("../package.json").version;
		let i = 0;
		setInterval(function() {
			const random = status[parseInt(i, 10)];
			const toDisplay = random.name.replace("{servers}", client.guilds.cache.filter(guild => guild.id != "568120814776614924" && guild.id != "892727526911258654").size) + " | v" + version;
			client.user.setActivity(toDisplay, { type: random.type });
			if (status[parseInt(i + 1, 10)]) i++;
			else i = 0;
		}, 20000); // Every 20 seconds
	}
};