const Command = require("../../base/Command"),
	{ EmbedBuilder, parseEmoji } = require("discord.js");

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
		if (message.author.id === "285109105717280768") return message.reply({ content: "Пошёл нахуй фахон" });

		const suggChannel = message.guild.channels.cache.get(data.guild.plugins.suggestions);
		if (!suggChannel) return message.error("general/suggest:MISSING_CHANNEL");

		const sugg = args.join(" ");
		if (!sugg) return message.error("general/suggest:MISSING_CONTENT");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: message.translate("general/suggest:TITLE", {
					user: message.author.username
				}),
				iconURL: message.author.displayAvatarURL({
					size: 512,
					format: "png"
				})
			})
			.addFields([
				{
					name: message.translate("common:AUTHOR"),
					value: `\`${message.author.username}#${message.author.discriminator}\``,
					inline: true
				},
				{
					name: message.translate("common:DATE"),
					value: this.client.printDate(new Date(Date.now())),
					inline: true
				},
				{
					name: message.translate("common:CONTENT"),
					value: sugg
				}
			])
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		const success = parseEmoji(this.client.customEmojis.cool).id;
		const error = parseEmoji(this.client.customEmojis.notcool).id;

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