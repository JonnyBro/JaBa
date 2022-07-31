const Command = require("../../base/Command"),
	{ PermissionsBitField, EmbedBuilder } = require("discord.js");

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
		const administrators = message.guild.members.cache.filter((m) => m.permissions.has(PermissionsBitField.Flags.Administrator) && !m.user.bot);
		const moderators = message.guild.members.cache.filter((m) => !administrators.has(m.id) && m.permissions.has(PermissionsBitField.Flags.ManageMessages) && !m.user.bot);
		const embed = new EmbedBuilder()
			.setAuthor({
				name: message.translate("general/staff:TITLE", {
					guild: message.guild.name
				})
			})
			.addFields([
				{
					name: message.translate("general/staff:ADMINS"),
					value: (administrators.size > 0 ? administrators.map((a) => `${a.presence ? this.client.customEmojis.status[a.presence.status] : this.client.customEmojis.status.offline} | <@${a.user.id}>`).join("\n") : message.translate("general/staff:NO_ADMINS"))
				},
				{
					name: message.translate("general/staff:MODS"),
					value: (moderators.size > 0 ? moderators.map((m) => `${m.presence ? this.client.customEmojis.status[m.presence.status] : this.client.customEmojis.status.offline} | <@${m.user.id}>`).join("\n") : message.translate("general/staff:NO_MODS"))
				}
			])
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});
		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Staff;