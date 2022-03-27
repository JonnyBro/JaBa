const Command = require("../../base/Command"),
	Discord = require("discord.js"),
	fetch = require("node-fetch");

class NSFW extends Command {
	constructor(client) {
		super(client, {
			name: "nsfw",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["n"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
			nsfw: true,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const tag = args[0];
		const subs = ["ecchi", "lewdanimegirls", "hentai", "hentaifemdom", "animearmpits", "animefeets", "animebooty", "biganimetiddies", "sideoppai", "ahegao"];

		if (tag === "list") {
			const embed = new Discord.MessageEmbed()
				.setColor(data.config.embed.color)
				.setFooter({
					text: data.config.embed.footer
				})
				.setTitle(message.translate("nsfw/nsfw:EMBED_TITLE"))
				.setDescription(subs.join("\n"))
				.setTimestamp();

			message.reply({
				embeds: [embed]
			});
		} else if (!tag) {
			const m = await message.sendT("nsfw/nsfw:SEARCHING_RANDOM");

			const res = await fetch("https://meme-api.herokuapp.com/gimme/hentai").then(response => response.json());
			const embed = new Discord.MessageEmbed()
				.setColor(data.config.embed.color)
				.setFooter({
					text: data.config.embed.footer
				})
				.setTitle(`${res.title}\n${message.translate("fun/memes:SUBREDDIT")}: ${res.subreddit}\n${message.translate("common:AUTHOR")}: ${res.author}\n${message.translate("fun/memes:UPS")}: ${res.ups}`)
				.setImage(res.url)
				.setTimestamp();

			m.edit({
				content: null,
				embeds: [embed]
			});
		} else if (subs.includes(tag)) {
			const m = await message.sendT("nsfw/nsfw:SEARCHING", {
				tag
			});

			const res = await fetch(`https://meme-api.herokuapp.com/gimme/${tag}`).then(response => response.json());
			const embed = new Discord.MessageEmbed()
				.setColor(data.config.embed.color)
				.setFooter({
					text: data.config.embed.footer
				})
				.setTitle(`${res.title}\n${message.translate("fun/memes:SUBREDDIT")}: ${res.subreddit}\n${message.translate("common:AUTHOR")}: ${res.author}\n${message.translate("fun/memes:UPS")}: ${res.ups}`)
				.setImage(res.url)
				.setTimestamp();

			m.edit({
				content: null,
				embeds: [embed]
			});
		} else return message.error("nsfw/nsfw:NOT_FOUND");
	}
}

module.exports = NSFW;