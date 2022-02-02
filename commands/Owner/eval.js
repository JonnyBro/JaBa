/* eslint-disable no-unused-vars */
const Command = require("../../base/Command");

class Eval extends Command {
	constructor(client) {
		super(client, {
			name: "eval",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["ev"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: true,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const content = message.content.split(" ").slice(1).join(" ");
		const result = new Promise((resolve) => resolve(eval(content)));

		return result.then((output) => {
			if (typeof output != "string") output = require("util").inspect(output, {
				depth: 0
			});
			if (output.includes(this.client.token)) output = output.replace(this.client.token, "T0K3N");
			message.channel.send({
				content: "```js\n" + output + "```"
			});
		}).catch((err) => {
			console.error(err);
			err = err.toString();
			if (err.includes(this.client.token)) err = err.replace(this.client.token, "T0K3N");
			message.channel.send({
				content: "```js\n" + err + "```"
			});
		});
	}
}

module.exports = Eval;