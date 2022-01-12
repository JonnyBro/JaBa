const Command = require("../../base/Command.js");

class Divorce extends Command {
	constructor(client) {
		super(client, {
			name: "divorce",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["di"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		if (!data.userData.lover) return message.error("economy/divorce:NOT_MARRIED");

		const user = this.client.users.cache.get(data.userData.lover) || await this.client.users.fetch(data.userData.lover);

		data.userData.lover = null;
		data.userData.save();

		const oldLover = await this.client.findOrCreateUser({
			id: user.id
		});
		oldLover.lover = null;
		oldLover.save();

		message.success("economy/divorce:DIVORCED", {
			username: user.username
		});
		user.send({
			content: message.translate("economy/divorce:DIVORCED_U", {
				username: message.author.username
			})
		});
	}
}

module.exports = Divorce;