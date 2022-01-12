const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Suggest extends Command {
	constructor(client) {
		super(client, {
			name: "suggest",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["sugg"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		if (message.author.id === "285109105717280768") return message.channel.send({ content: "пошёл нахуй фахон" });

		const suggChannel = message.guild.channels.cache.get(data.guild.plugins.suggestions);
		if (!suggChannel) return message.error("general/suggest:MISSING_CHANNEL");

		const sugg = args.join(" ");
		if (!sugg) return message.error("general/suggest:MISSING_CONTENT");

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.translate("general/suggest:TITLE", {
					user: message.author.username
				}),
				iconURL: message.author.displayAvatarURL({
					size: 512,
					dynamic: true,
					format: "png"
				})
			})
			.addField(message.translate("common:AUTHOR"), `\`${message.author.username}#${message.author.discriminator}\``, true)
			.addField(message.translate("common:DATE"), message.printDate(new Date(Date.now())), true)
			.addField(message.translate("common:CONTENT"), sugg)
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		const success = Discord.Util.parseEmoji(this.client.customEmojis.success).id;
		const error = Discord.Util.parseEmoji(this.client.customEmojis.error).id;

		suggChannel.send({
			embeds: [embed]
		}).then(async (m) => {
			await m.react(success);
			await m.react(error);
		});

		message.success("general/suggest:SUCCESS", {
			channel: suggChannel.toString()
		});
	}
}

module.exports = Suggest;