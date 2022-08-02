const Command = require("../../base/Command"),
	{ EmbedBuilder, parseEmoji} = require("discord.js");

class Report extends Command {
	constructor(client) {
		super(client, {
			name: "report",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["repo"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		if (message.author.id === "285109105717280768") return message.reply({ content: "Пошёл нахуй фахон" });

		const repChannel = message.guild.channels.cache.get(data.guild.plugins.reports);
		if (!repChannel) return message.error("general/report:MISSING_CHANNEL");

		const member = await this.client.resolveMember(args[0], message.guild);
		if (!member) return message.error("general/report:MISSING_USER");
		if (member.id === message.author.id) return message.error("general/report:INVALID_USER");

		const rep = args.slice(1).join(" ");
		if (!rep) return message.error("general/report:MISSING_REASON");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: message.translate("general/report:TITLE", {
					user: member.user.tag
				}),
				iconURL: message.author.displayAvatarURL({
					extension: "png",
					size: 512
				})
			})
			.addFields([
				{
					name: message.translate("common:AUTHOR"),
					value: message.author.tag,
					inline: true
				},
				{
					name: message.translate("common:DATE"),
					value: this.client.printDate(new Date(Date.now())),
					inline: true
				},
				{
					name: message.translate("common:REASON"),
					value: rep,
					inline: true
				},
				{
					name: message.translate("common:USER"),
					value: `\`${member.user.tag}\` (${member.user.toString()})`,
					inline: true
				}
			])
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		const success = parseEmoji(this.client.customEmojis.cool).id;
		const error = parseEmoji(this.client.customEmojis.notcool).id;

		repChannel.send({
			embeds: [embed]
		}).then(async (m) => {
			await m.react(success);
			await m.react(error);
		});

		message.success("general/report:SUCCESS", {
			channel: repChannel.toString()
		});
	}
}

module.exports = Report;