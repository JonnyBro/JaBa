const Command = require("../../base/Command.js");

class Eightball extends Command {
	constructor(client) {
		super(client, {
			name: "8ball",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["eight-ball", "eightball"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args) {
		if (!args[0] || !message.content.endsWith("?")) return message.error("fun/8ball:ERR_QUESTION");

		const answerN = this.client.functions.randomNum(1, 20);
		const answer = message.translate(`fun/8ball:RESPONSE_${answerN + 1}`);

		message.channel.send(answer);
	}
};

module.exports = Eightball;