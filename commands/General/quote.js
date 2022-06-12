const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Quote extends Command {
	constructor(client) {
		super(client, {
			name: "quote",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["qu"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		function embed(m) {
			const embed = new Discord.MessageEmbed()
				.setAuthor({
					name: m.author.tag,
					iconURL: m.author.displayAvatarURL({
						size: 512,
						dynamic: true,
						format: "png"
					})
				})
				.setDescription(m.content)
				.setColor(m.member ? m.member.roles.highest ? m.member.roles.highest.color : data.config.embed.color : data.config.embed.color)
				.setFooter({
					text: m.guild.name + " | #" + m.channel.name
				})
				.setTimestamp(m.createdTimestamp);
			if (m.attachments.size > 0) embed.setImage(m.attachments.first().url);
			return embed;
		}

		const msgID = args[0];
		if (isNaN(msgID)) {
			message.error("general/quote:MISSING_ID").then(() => {
				if (message.deletable) message.delete();
			});
			return;
		}

		let channel = args[1];
		if (args[1]) {
			channel = this.client.channels.cache.get(args[1]);
			if (!channel) {
				message.error("general/quote:NO_MESSAGE_ID").then(() => {
					if (message.deletable) message.delete();
				});
				return;
			}
		}

		if (!channel) {
			message.channel.messages.fetch(msgID).catch(() => {
				message.error("general/quote:NO_MESSAGE_ID").then(() => {
					if (message.deletable) message.delete();
				});
				return;
			}).then((msg) => {
				if (message.deletable) message.delete();
				message.reply({
					embeds: [embed(msg)]
				});
			});
		} else {
			channel.messages.fetch(msgID).then((msg) => {
				if (message.deletable) message.delete();
				message.reply({
					embeds: [embed(msg)]
				});
			}).catch(() => {
				message.error("general/quote:NO_MESSAGE_ID").then(() => {
					if (message.deletable) message.delete();
				});
				return;
			});
		}
	}
}

module.exports = Quote;