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
		let hiddenGuild = await client.guilds.fetch("568120814776614924");
		let tUsers = client.users.cache.size - hiddenGuild.memberCount;
		let tServers = client.guilds.cache.size - 1;

		client.logger.log(`Loaded a total of ${commands.length} command(s).`, "ready");
		client.logger.log(`${client.user.tag}, ready to serve ${tUsers} users in ${tServers} servers.`, "ready");
		client.logger.log(`Invite Link: ${client.generateInvite({ scopes: ["bot", "applications.commands"], permissions: [ PermissionsBitField.Flags.Administrator ] })}`, "ready");

		const birthdays = require("../helpers/birthdays");
		birthdays.init(client);

		const checkUnmutes = require("../helpers/checkUnmutes");
		checkUnmutes.init(client);

		const checkReminds = require("../helpers/checkReminds");
		checkReminds.init(client);

		const cleanup = require("../helpers/cleanup");
		cleanup.init(client);

		if (client.config.dashboard.enabled) client.dashboard.init(client);

		const version = require("../package.json").version;
		const status = [
			{ name: "help", type: ActivityType.Watching },
			{ name: `${commands.length} ${client.getNoun(commands.length, client.translate("misc:NOUNS:COMMANDS:1"), client.translate("misc:NOUNS:COMMANDS:2"), client.translate("misc:NOUNS:COMMANDS:5"))}`, type: ActivityType.Listening },
			{ name: `${tServers} ${client.getNoun(tServers, client.translate("misc:NOUNS:SERVER:1"), client.translate("misc:NOUNS:SERVER:2"), client.translate("misc:NOUNS:SERVER:5"))}`, type: ActivityType.Watching },
			{ name: `${tUsers} ${client.getNoun(tUsers, client.translate("misc:NOUNS:USERS:1"), client.translate("misc:NOUNS:USERS:2"), client.translate("misc:NOUNS:USERS:5"))}`, type: ActivityType.Watching },
		];

		let i = 0;
		setInterval(async function () {
			hiddenGuild = await client.guilds.fetch("568120814776614924");
			tUsers = client.users.cache.size - hiddenGuild.memberCount;
			tServers = client.guilds.cache.size - 1;
			const toShow = status[i];

			client.user.setActivity(`${toShow.name} | v${version}`, {
				type: toShow.type,
			});

			if (status[i + 1]) i++;
			else i = 0;
		}, 10000); // Every 10 seconds
	}
}

module.exports = Ready;