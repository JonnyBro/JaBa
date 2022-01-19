const Command = require("../../base/Command");

class Eightball extends Command {
	constructor(client) {
		super(client, {
			name: "8ball",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["8b"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args) {
		if (!args[0] || !message.content.endsWith("?")) return message.error("fun/8ball:ERR_QUESTION");

		const answerN = this.client.functions.randomNum(1, 19);
		const answer = message.translate(`fun/8ball:RESPONSE_${answerN + 1}`);

		message.reply({
			content: answer
		});
	}
}

module.exports = Eightball;