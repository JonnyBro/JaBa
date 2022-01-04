const Command = require("../../base/Command.js"),
	Discord = require("discord.js"),
	fetch = require("node-fetch");

class Hentai extends Command {
	constructor(client) {
		super(client, {
			name: "hentai",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["hen"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
			nsfw: true,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const category = args[0];
		var gif = null;
		const embed = new Discord.MessageEmbed()
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			})
			.setTimestamp()

		switch (category) {
			case "neko":
				gif = await fetch("https://nekos.life/api/v2/img/nsfw_neko_gif").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "cum":
				gif = await fetch("https://nekos.life/api/v2/img/cum").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "solo":
				gif = await fetch("https://nekos.life/api/v2/img/solo").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "anal":
				gif = await fetch("https://nekos.life/api/v2/img/anal").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "yuri":
				gif = await fetch("https://nekos.life/api/v2/img/yuri").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "blowjob":
				gif = await fetch("https://nekos.life/api/v2/img/bj").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "bj":
				gif = await fetch("https://nekos.life/api/v2/img/bj").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "pussy":
				gif = await fetch("https://nekos.life/api/v2/img/pussy").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "classic":
				gif = await fetch("https://nekos.life/api/v2/img/hentai").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "futa":
				gif = await fetch("https://nekos.life/api/v2/img/futanari").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "futanari":
				gif = await fetch("https://nekos.life/api/v2/img/futanari").then(response => response.json());
				embed.setImage(gif.url)
				break;

			case "help":
				embed.setTitle(message.translate("nsfw/hentai:HELP_1"))
				embed.setDescription(message.translate("nsfw/hentai:HELP_2"))
				break;

			default:
				gif = await fetch("https://nekos.life/api/v2/img/Random_hentai_gif").then(response => response.json());
				embed.setImage(gif.url)
				embed.setDescription(message.translate("nsfw/hentai:NOCATEGORY", {
					prefix: data.guild.prefix
				}))
				break;
		};
		message.channel.send({
			embeds: [embed]
		});
	}
};

module.exports = Hentai;