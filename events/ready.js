const { ActivityType } = require("discord.js");
const BaseEvent = require("../base/BaseEvent");

class Ready extends BaseEvent {
	constructor() {
		super({
			name: "ready",
			once: false,
		});
	}
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	async execute(client) {
		const commands = [...new Map(client.commands.map(v => [v.constructor.name, v])).values()];

		let servers = client.guilds.cache.size;
		let users = 0;
		client.guilds.cache.forEach(g => {
			users += g.memberCount;
		});

		const birthdays = require("../helpers/birthdays");
		birthdays.init(client);

		const checkReminds = require("../helpers/checkReminds");
		checkReminds.init(client);

		if (client.config.dashboard.enabled) await client.dashboard.load(client);

		client.logger.ready(`Loaded a total of ${commands.length} command(s).`);
		client.logger.ready(`${client.user.getUsername()}, ready to serve ${users} members in ${servers} servers.`);

		console.timeEnd("botReady");

		const version = require("../package.json").version;
		const status = [
			`${commands.length} ${client.functions.getNoun(commands.length, client.translate("misc:NOUNS:COMMANDS:1"), client.translate("misc:NOUNS:COMMANDS:2"), client.translate("misc:NOUNS:COMMANDS:5"))} available!`,
			`I'm in ${servers} ${client.functions.getNoun(servers, client.translate("misc:NOUNS:SERVER:1"), client.translate("misc:NOUNS:SERVER:2"), client.translate("misc:NOUNS:SERVER:5"))}!`,
			`Cached ${users} ${client.functions.getNoun(users, client.translate("misc:NOUNS:USERS:1"), client.translate("misc:NOUNS:USERS:2"), client.translate("misc:NOUNS:USERS:5"))}.`,
			"Use /help for commands list!",
			"Did you know that I have a brother called JaBa IT? Yeah! Ask Jonny about him.",
		];

		let i = 0;
		setInterval(() => {
			servers = client.guilds.fetch().then(g => g.size);
			users = 0;
			client.guilds.cache.forEach(g => {
				users += g.memberCount;
			});

			client.user.setActivity({
				type: ActivityType.Custom,
				name: "custom",
				state: `${status[i]} | v${version}`,
			});

			if (status[i + 1]) i++;
			else i = 0;
		}, 30 * 1000); // Every 30 seconds
	}
}

module.exports = Ready;
