const { PermissionsBitField, ActivityType } = require("discord.js");
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
	 * @param {import("../base/JaBa")} client
	 */
	async execute(client) {
		const commands = [...new Map(client.commands.map(v => [v.constructor.name, v])).values()];

		let hiddenGuildMembersCount = client.guilds.cache.get("568120814776614924").memberCount;
		let tServers = client.guilds.cache.size - 1;
		let tUsers = 0;
		client.guilds.cache.forEach(g => {
			tUsers += g.memberCount;
		});
		tUsers = tUsers - hiddenGuildMembersCount;

		client.logger.log(`Loaded a total of ${commands.length} command(s).`, "ready");
		client.logger.log(`${client.user.discriminator === "0" ? client.user.username : client.user.tag}, ready to serve ${tUsers} members in ${tServers} servers.`, "ready");
		client.logger.log(`Invite Link: ${client.generateInvite({ scopes: ["bot", "applications.commands"], permissions: [ PermissionsBitField.Flags.Administrator ] })}`, "ready");
		console.timeEnd("botReady");

		const birthdays = require("../helpers/birthdays");
		birthdays.init(client);

		const checkUnmutes = require("../helpers/checkUnmutes");
		checkUnmutes.init(client);

		const checkReminds = require("../helpers/checkReminds");
		checkReminds.init(client);

		if (client.config.dashboard.enabled) client.dashboard.load(client);

		const version = require("../package.json").version;
		const status = [
			{ name: "help", type: ActivityType.Watching },
			{ name: `${commands.length} ${client.functions.getNoun(commands.length, client.translate("misc:NOUNS:COMMANDS:1"), client.translate("misc:NOUNS:COMMANDS:2"), client.translate("misc:NOUNS:COMMANDS:5"))}`, type: ActivityType.Listening },
			{ name: `${tServers} ${client.functions.getNoun(tServers, client.translate("misc:NOUNS:SERVER:1"), client.translate("misc:NOUNS:SERVER:2"), client.translate("misc:NOUNS:SERVER:5"))}`, type: ActivityType.Watching },
			{ name: `${tUsers} ${client.functions.getNoun(tUsers, client.translate("misc:NOUNS:USERS:1"), client.translate("misc:NOUNS:USERS:2"), client.translate("misc:NOUNS:USERS:5"))}`, type: ActivityType.Watching },
		];

		let i = 0;
		setInterval(async function () {
			hiddenGuildMembersCount = client.guilds.cache.get("568120814776614924").memberCount;
			tServers = client.guilds.cache.size - 1;
			tUsers = 0;
			client.guilds.cache.forEach(g => {
				tUsers += g.memberCount;
			});
			tUsers = tUsers - hiddenGuildMembersCount;

			client.user.setActivity(`${status[i].name} | v${version}`, {
				type: status[i].type,
			});

			if (status[i + 1]) i++;
			else i = 0;
		}, 30 * 1000); // Every 30 seconds
	}
}

module.exports = Ready;