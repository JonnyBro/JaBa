const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Warns extends Command {
	constructor(client) {
		super(client, {
			name: "warns",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["ws"],
			memberPermissions: ["MANAGE_MESSAGES"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const user = await this.client.resolveUser(args[0]);
		if (!user) return message.error("moderation/warns:MISSING_MEMBER");

		const memberData = await this.client.findOrCreateMember({
			id: user.id,
			guildID: message.guild.id
		});

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: user.tag,
				iconURL: user.displayAvatarURL({
					size: 512,
					format: "png"
				})
			})
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		if (memberData.sanctions.length < 1) {
			embed.setDescription(message.translate("moderation/warns:NO_SANCTION", {
				username: user.tag
			}));
			return message.reply({
				embeds: [embed]
			});
		} else {
			memberData.sanctions.forEach((s) => {
				embed.addFields([
					{
						name: s.type + " | #" + s.case,
						value: `${message.translate("common:MODERATOR")}: <@${s.moderator}>\n${message.translate("common:REASON")}: ${s.reason}`,
						inline: true
					}
				]);
			});
		}
		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Warns;