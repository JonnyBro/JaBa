const { Permissions } = require("discord.js");

module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run() {
		const client = this.client;
		let hiddenGuild = await client.guilds.fetch("568120814776614924");
		let tUsers = client.users.cache.size - hiddenGuild.memberCount;
		let tServers = client.guilds.cache.size - 1;

		// Logs some informations using logger
		client.logger.log(`Loading a total of ${client.commands.size} command(s).`, "log");
		client.logger.log(`${client.user.tag}, ready to serve ${tUsers} users in ${tServers} servers.`, "ready");
		client.logger.log(`Invite Link: ${client.generateInvite({ scopes: ["bot"] , permissions: [Permissions.FLAGS.ADMINISTRATOR] })}`, "ready");

		// Discord Together
		const discordtogether = require("../helpers/discordTogether");
		discordtogether.init(client);

		// Birthday Announce
		const birthdays = require("../helpers/birthdays");
		birthdays.init(client);

		// DiscordBots.org STATS
		const discordbotsorg = require("../helpers/discordbots.org");
		discordbotsorg.init(client);

		// Unmute users
		const checkUnmutes = require("../helpers/checkUnmutes");
		checkUnmutes.init(client);

		// Send reminds
		const checkReminds = require("../helpers/checkReminds");
		checkReminds.init(client);

		// Start the dashboard
		if (client.config.dashboard.enabled) client.dashboard.load(client);

		// Update status
		const version = require("../package.json").version;
		const status = [
			{ name: "help", type: "LISTENING" },
			{ name: `${client.commands.size} ${client.getNoun(client.commands.size, client.translate("misc:NOUNS:COMMANDS:1"), client.translate("misc:NOUNS:COMMANDS:2"), client.translate("misc:NOUNS:COMMANDS:5"))}`, type: "LISTENING"},
			{ name: `${tServers} ${client.getNoun(tServers, client.translate("misc:NOUNS:SERVER:1"), client.translate("misc:NOUNS:SERVER:2"), client.translate("misc:NOUNS:SERVER:5"))}`, type: "WATCHING" },
			{ name: `${tUsers} ${client.getNoun(tUsers, client.translate("misc:NOUNS:USERS:1"), client.translate("misc:NOUNS:USERS:2"), client.translate("misc:NOUNS:USERS:5"))}`, type: "WATCHING" }
		];

		let i = 0;
		setInterval(async function () {
			hiddenGuild = await client.guilds.fetch("568120814776614924");
			tUsers = client.users.cache.size - hiddenGuild.memberCount;
			tServers = client.guilds.cache.size - 1;
			const toShow = status[parseInt(i, 10)];

			client.user.setActivity(`${toShow.name} | v${version}`, {
				type: toShow.type
			});

			if (status[parseInt(i + 1, 10)]) i++;
			else i = 0;
		}, 20000); // Every 20 seconds
	}
};