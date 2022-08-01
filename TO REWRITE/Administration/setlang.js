const Command = require("../../base/Command");

class Setlang extends Command {
	constructor(client) {
		super(client, {
			name: "setlang",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["setl"],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const language = this.client.languages.find((l) => l.name === args[0] || l.aliases.includes(args[0]));

		if (!args[0] || !language) return message.error("administration/setlang:MISSING_LANG", { list: this.client.languages.map((l) => `\`${l.name} (${l.aliases.slice(0, 2).join(", ")})\``).join(", ") });

		data.guild.language = language.name;
		await data.guild.save();

		return message.sendT("administration/setlang:SUCCESS", {
			lang: language.nativeName
		});
	}
}

module.exports = Setlang;