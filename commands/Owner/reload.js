const Command = require("../../base/Command"),
	i18next = require("i18next"),
	autoUpdateDocs = require("../../helpers/autoUpdateDocs");

class Reload extends Command {
	constructor(client) {
		super(client, {
			name: "reload",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["rel"],
			memberPermissions: [],
			botPermissions: [],
			nsfw: false,
			ownerOnly: true,
			cooldown: 2000
		});
	}

	async run(message, args) {
		const command = args[0];
		const cmd = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command));
		if (!cmd) return message.error("owner/reload:NOT_FOUND", { search: command });

		await this.client.unloadCommand(cmd.conf.location, cmd.help.name);
		await this.client.loadCommand(cmd.conf.location, cmd.help.name);

		i18next.reloadResources(["ru-RU", "uk-UA"]);
		autoUpdateDocs.update(this.client);

		message.success("owner/reload:SUCCESS", {
			command: cmd.help.name
		});
	}
}

module.exports = Reload;