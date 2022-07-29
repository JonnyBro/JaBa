const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Invites extends Command {
	constructor(client) {
		super(client, {
			name: "invites",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["invs"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_GUILD"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		let member = await this.client.resolveMember(args[0], message.guild);
		if (!member) member = message.member;

		const invites = await message.guild.invites.fetch().catch(() => {});
		if (!invites) return message.error("misc:ERR_OCCURRED");

		const memberInvites = invites.filter((i) => i.inviter && i.inviter.id === member.user.id);

		if (memberInvites.size <= 0) {
			if (member === message.member) {
				return message.error("general/invites:NOBODY_AUTHOR");
			} else {
				return message.error("general/invites:NOBODY_MEMBER", {
					member: member.user.tag
				});
			}
		}

		const content = memberInvites.map((i) => {
			return message.translate("general/invites:CODE", {
				uses: i.uses,
				code: i.code,
				channel: i.channel.toString()
			});
		}).join("\n");
		let index = 0;
		memberInvites.forEach((invite) => index += invite.uses);

		const embed = new Discord.MessageEmbed()
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			})
			.setAuthor({
				name: message.translate("general/invites:TRACKER")
			})
			.setDescription(message.translate("general/invites:TITLE", {
				member: member.user.tag,
				guild: message.guild.name
			}))
			.addField(message.translate("general/invites:FIELD_INVITED"), message.translate("general/invites:FIELD_MEMBERS", {
				total: index
			}))
			.addField(message.translate("general/invites:FIELD_CODES"), content);

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Invites;