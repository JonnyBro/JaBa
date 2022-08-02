const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Userinfo extends Command {
	constructor(client) {
		super(client, {
			name: "userinfo",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["ui"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		let displayPresence = true;

		const isID = !isNaN(args[0]);

		let user;
		if (!args[0]) user = message.author;
		if (message.mentions.users.first()) user = message.mentions.users.first();

		if (isID && !user) {
			user = this.client.users.cache.get(args[0]);
			if (!user) {
				user = await this.client.users.fetch(args[0], true).catch(() => {});
				displayPresence = false;
			}
		}

		if (!user) return message.error("general/userinfo:INVALID_USER");

		let member = null;
		if (message.guild) member = await message.guild.members.fetch(user).catch(() => {});

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: `${user.tag} (${user.id})`,
				iconURL: user.displayAvatarURL({
					extension: "png",
					size: 512
				})
			})
			.setThumbnail(user.displayAvatarURL())
			.addFields([
				{
					name: ":man: " + message.translate("common:USERNAME"),
					value: member.nickname || user.username,
					inline: true
				},
				{
					name: this.client.customEmojis.discriminator + " " + message.translate("common:DISCRIMINATOR"),
					value: user.discriminator,
					inline: true
				},
				{
					name: this.client.customEmojis.bot + " " + message.translate("common:ROBOT"),
					value: (user.bot ? message.translate("common:YES") : message.translate("common:NO")),
					inlinee: true
				},
				{
					name: this.client.customEmojis.calendar + " " + message.translate("common:CREATION"),
					value: this.client.printDate(user.createdAt),
					inline: true
				},
				{
					name: this.client.customEmojis.avatar + " " + message.translate("common:AVATAR"),
					value: member.displayAvatarURL({
						extension: "png",
						size: 512
					})
				}
			])
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		if (displayPresence) {
			if (member.presence.activities[0].name === "Custom Status") {
				embed.addFields([
					{
						name: this.client.customEmojis.games + " " + message.translate("common:GAME"),
						value: (member.presence.activities[0] ? `Пользовательский статус\n${member.presence.activities[0].state || message.translate("common:NOT_DEFINED")}` : message.translate("general/userinfo:NO_GAME")),
						inline: true
					},
					{
						name: this.client.customEmojis.status[member.presence.status] + " " + message.translate("common:STATUS"),
						value: message.translate("common:STATUS_" + (member.presence.status.toUpperCase())),
						inline: true
					}
				]);
			} else {
				embed.addFields([
					{
						name: this.client.customEmojis.games + " " + message.translate("common:GAME"),
						value: (member.presence.activities[0] ? `${member.presence.activities[0].name}\n${member.presence.activities[0].details}\n${member.presence.activities[0].state}` : message.translate("general/userinfo:NO_GAME")),
						inline: true
					},
					{
						name: this.client.customEmojis.status[member.presence.status] + " " + message.translate("common:STATUS"),
						value: message.translate("common:STATUS_" + (member.presence.status.toUpperCase())),
						inline: true
					}
				]);
			}
		}

		if (member) {
			embed.addFields([
				{
					name: this.client.customEmojis.calendar2 + " " + message.translate("common:JOIN"),
					value: this.client.printDate(member.joinedAt),
					inline: true
				},
				{
					name: this.client.customEmojis.color + " " + message.translate("common:COLOR"),
					value: member.displayHexColor,
					inline: true
				},
				{
					name: this.client.customEmojis.pencil + " " + message.translate("common:NICKNAME"),
					value: (member.nickname ? member.nickname : message.translate("general/userinfo:NO_NICKNAME")),
					inline: true
				},
				{
					name: this.client.customEmojis.roles + " " + message.translate("common:ROLES"),
					value: (member.roles.size > 10 ? member.roles.cache.map((r) => r).slice(0, 9).join(", ") + " " + message.translate("general/userinfo:MORE_ROLES", {
						count: member.roles.cache.size - 10
					}) : (member.roles.cache.size < 1) ? message.translate("general/userinfo:NO_ROLE") : member.roles.cache.map((r) => r).join(", "))
				}
			]);
		}

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Userinfo;