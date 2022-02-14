const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Announcement extends Command {
	constructor(client) {
		super(client, {
			name: "announcement",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["ann"],
			memberPermissions: ["MENTION_EVERYONE"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const text = args.join(" ");
		if (!text) return message.error("moderation/announcement:MISSING_TEXT");
		if (text.length > 1030) return message.error("moderation/announcement:TOO_LONG");

		let mention = null;
		const msg = await message.channel.send(message.translate("moderation/announcement:MENTION_PROMPT"));

		const filter = m => m.author.id === message.author.id;
		const collector = new Discord.MessageCollector(message.channel, {
			filter,
			time: 240000
		});

		collector.on("collect", async (tmsg) => {
			if (tmsg.content.toLowerCase() === message.translate("common:NO").toLowerCase()) {
				tmsg.delete();
				msg.delete();
				collector.stop(true);

				if (message.deletable) message.delete();
			}

			if (tmsg.content.toLowerCase() === message.translate("common:YES").toLowerCase()) {
				tmsg.delete();
				msg.delete();
				const tmsg1 = await message.channel.send(message.translate("moderation/announcement:MENTION_TYPE_PROMPT"));

				const filter = m => m.author.id === message.author.id;
				const c = new Discord.MessageCollector(message.channel, {
					filter,
					time: 60000
				});
				c.on("collect", (m) => {
					if (m.content.toLowerCase() === "here") {
						mention = "@here";
						tmsg1.delete();
						m.delete();
						collector.stop(true);
						c.stop(true);
					} else if (m.content.toLowerCase() === "everyone") {
						mention = "@everyone";
						tmsg1.delete();
						m.delete();
						collector.stop(true);
						c.stop(true);
					}
				});

				c.on("end", (collected, reason) => {
					if (reason === "time") return message.error("misc:TIMES_UP");
				});

				if (message.deletable) message.delete();
			}
		});

		collector.on("end", (collected, reason) => {
			if (reason === "time") return message.error("misc:TIMES_UP");

			const embed = new Discord.MessageEmbed()
				.setAuthor({
					name: message.translate("moderation/announcement:TITLE")
				})
				.setColor(data.config.embed.color)
				.setFooter({
					text: message.author.tag
				})
				.setTimestamp()
				.setDescription(text);

			message.channel.send({
				content: mention,
				embeds: [embed]
			});
		});
	}
}

module.exports = Announcement;