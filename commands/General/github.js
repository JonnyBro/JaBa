const Command = require("../../base/Command.js"),
	Discord = require("discord.js"),
	fetch = require("node-fetch");

class Github extends Command {
	constructor(client) {
		super(client, {
			name: "github",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["git"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const res = await fetch("https://api.github.com/repos/JonnyBro/jaba-v2");
		const json = await res.json();

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: this.client.user.tag,
				iconURL: this.client.user.displayAvatarURL({
					size: 512,
					dynamic: true,
					format: "png"
				})
			})
			.setDescription(`[${message.translate("general/github:CLICK_HERE")}](${json.html_url})`)
			.addField("Название", json.name, true)
			.addField("Звёзды", json.stargazers_count, true)
			.addField("Форки", json.forks_count, true)
			.addField(message.translate("general/github:LANGUAGE"), json.language, true)
			.addField(message.translate("general/github:OWNER"), `[${json.owner.login}](${json.owner.html_url})`)
			.setImage(json.owner.avatar_url)
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		message.channel.send({
			embeds: [embed]
		});
	}
};

module.exports = Github;