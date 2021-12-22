const Command = require("../../base/Command.js"),
	Discord = require("discord.js"),
	fs = require("fs");

class Clips extends Command {
	constructor (client) {
		super(client, {
			name: "clips",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run (message, args, data) {
		fs.readdir("./clips", function(err, files) {
			if (err) return console.log("Unable to read directory: " + err);

			let clips = [];

			files.forEach(function(file) {
				clips.push(file.substring(0, file.length - 4));
			});

			const embed = new Discord.MessageEmbed()
				.setTitle(message.translate("music/clips:EMBED_TITLE"))
				.setDescription(clips.join("\n"))
				.setColor(data.config.embed.color)
				.setFooter(data.config.embed.footer)
				.setTimestamp()
			message.channel.send(embed);
		});
	}
};

module.exports = Clips;