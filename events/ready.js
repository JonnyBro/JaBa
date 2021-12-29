const chalk = require("chalk");

module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run() {
		const client = this.client;

		// Logs some informations using logger
		client.logger.log(`Loading a total of ${client.commands.size} command(s).`, "log");
		client.logger.log(`${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.filter(guild => guild.id != "568120814776614924" && guild.id != "892727526911258654").size} servers.`, "ready");
		client.logger.log(`Invite Link: https://discordapp.com/oauth2/authorize?client_id=${this.client.user.id}&scope=bot&permissions=8`);

		// Discord Together
		const discordtogether = require("../helpers/discordTogether");
		discordtogether.init(client);

		// Birthday Announce
		const birthdays = require("../helpers/birthdays");
		birthdays.init(client);

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
		let servers = client.guilds.cache.filter(guild => guild.id != "568120814776614924" && guild.id != "892727526911258654").size;
		const version = require("../package.json").version;
		const status = [
			{ name: `${servers} ${getNoun(servers, "сервер", "сервера", "серверов")}`, type: "WATCHING" },
			{ name: "help", type: "WATCHING" }
		];

		let i = 0;
		setInterval(function () {
			servers = client.guilds.cache.filter(guild => guild.id != "568120814776614924" && guild.id != "892727526911258654").size;
			const random = status[parseInt(i, 10)];

			client.user.setActivity(`${random.name} | v${version}`, {
				type: random.type
			});

			if (status[parseInt(i + 1, 10)]) i++;
			else i = 0;
		}, 20000); // Every 20 seconds
	}
};

function getNoun(number, one, two, five) {
	let n = Math.abs(number);
	n %= 100;
	if (n >= 5 && n <= 20) return five;
	n %= 10;
	if (n === 1) return one;
	if (n >= 2 && n <= 4) return two;

	return five;
};