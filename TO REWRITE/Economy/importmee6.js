const { getUserXp } = require("mee6-levels-api");
const Command = require("../../base/Command"),
	Discord = require("discord.js");

class ImportMee6 extends Command {
	constructor(client) {
		super(client, {
			name: "money",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		await getUserXp(message.guild.id, message.author.id).then(user => {
			Levels.setLevel(message.author.id, message.guild.id, user.level);
			message.lineReply(`Ваш уровень Mee6 синхронизирован! Новый уровень - ${user.level}`);
		});
	}
};

module.exports = ImportMee6;