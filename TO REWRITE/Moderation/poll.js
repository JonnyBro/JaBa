const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Poll extends Command {
	constructor(client) {
		super(client, {
			name: "poll",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["po"],
			memberPermissions: ["MANAGE_MESSAGES"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const question = args.join(" ");
		if (!question) return message.error("moderation/poll:MISSING_QUESTION");

		let mention = null;
		const msg = await message.sendT("moderation/announcement:MENTION_PROMPT");

		const filter = m => m.author.id === message.author.id;
		const collector = new Discord.MessageCollector(message.channel, {
			filter,
			time: 240000
		});

		collector.on("collect", async tmsg => {
			if (tmsg.content.toLowerCase() === message.translate("common:NO").toLowerCase()) {
				tmsg.delete();
				msg.delete();
				collector.stop(true);

				message.delete();
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

				message.delete();
			}
		});

		collector.on("end", (collected, reason) => {
			if (reason === "time") return message.error("misc:TIMES_UP");

			const success = this.client.customEmojis.success.split(":")[1];
			const error = this.client.customEmojis.error.split(":")[1];

			const emojis = [
				this.client.emojis.cache.find(e => e.name === success),
				this.client.emojis.cache.find(e => e.name === error)
			];

			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: message.translate("moderation/poll:TITLE")
				})
				.setColor(data.config.embed.color)
				.addFields([
					{
						name: question,
						value: message.translate("moderation/poll:REACT", {
							success: emojis[0].toString(),
							error: emojis[1].toString()
						})
					}
				]);

			message.channel.send({
				content: mention,
				embeds: [embed]
			}).then(async (m) => {
				await m.react(emojis[0]);
				await m.react(emojis[1]);
			});
		});
	}
}

module.exports = Poll;