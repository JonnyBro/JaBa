const Command = require("../../base/Command");

class Avatar extends Command {
	constructor(client) {
		super(client, {
			name: "avatar",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: [],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args) {
		let user = await this.client.resolveUser(args[0]);
		if (!user) user = message.author;
		const avatarURL = user.displayAvatarURL({
			size: 512,
			dynamic: true,
			format: "png"
		});

		if (message.content.includes("link")) message.channel.send({ content: `<${avatarURL}>` });

		message.channel.send({
			files: [{
				attachment: avatarURL
			}]
		});
	}
}

module.exports = Avatar;