const Command = require("../../base/Command");

class Ping extends Command {
	constructor(client) {
		super(client, {
			name: "ping",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["pi"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message) {
		message.sendT("general/ping:CONTENT", {
			ping: "..."
		}).then((m) => {
			m.sendT("general/ping:CONTENT", {
				ping: m.createdTimestamp - message.createdTimestamp
			}, { edit: true });
		});
	}
}

module.exports = Ping;