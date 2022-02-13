const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Joke extends Command {
	constructor(client) {
		super(client, {
			name: "joke",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["jo"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const joke = await this.client.icanhazdadjoke();
		if (joke.status !== 200) return message.error("misc:ERR_OCCURRED");

		const embed = new Discord.MessageEmbed()
			.setDescription(joke.joke)
			.setFooter({
				text: message.translate("fun/joke:FOOTER", {
					id: joke.id
				})
			})
			.setColor(data.config.embed.color);

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Joke;