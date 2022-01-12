const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Staff extends Command {
	constructor(client) {
		super(client, {
			name: "staff",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["staf"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		await message.guild.members.fetch();
		const administrators = message.guild.members.cache.filter((m) => m.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR) && !m.user.bot);
		const moderators = message.guild.members.cache.filter((m) => !administrators.has(m.id) && m.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES) && !m.user.bot);
		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.translate("general/staff:TITLE", {
					guild: message.guild.name
				})
			})
			.addField(message.translate("general/staff:ADMINS"), (administrators.size > 0 ? administrators.map((a) => `${this.client.customEmojis.status[a.presence.status]} | <@${a.user.id}>`).join("\n") : message.translate("general/staff:NO_ADMINS")))
			.addField(message.translate("general/staff:MODS"), (moderators.size > 0 ? moderators.map((m) => `${this.client.customEmojis.status[m.presence.status]} | <@${m.user.id}>`).join("\n") : message.translate("general/staff:NO_MODS")))
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});
		message.channel.send({
			embeds: [embed]
		});
	}
}

module.exports = Staff;