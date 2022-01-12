const Command = require("../../base/Command.js");

class Choice extends Command {
	constructor(client) {
		super(client, {
			name: "choice",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["cho", "ra"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args) {
		// Gets the answers by spliting on "/"
		const answers = args.join(" ").split("/");
		if (answers.length < 2) return message.error("fun/choice:MISSING");
		if (answers.some(answer => !answer)) return message.error("fun/choice:EMPTY");

		const m = await message.sendT("fun/choice:PROGRESS", null, false, false, "loading");

		setTimeout(() => {
			const result = answers[parseInt(Math.floor(Math.random() * answers.length))];
			m.success("fun/choice:DONE", { result }, {
				edit: true
			});
		}, 1500);
	}
}

module.exports = Choice;