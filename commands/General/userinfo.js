const Command = require("../../base/Command.js"),
	Discord = require("discord.js"),
	fetch = require("node-fetch");

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

		var user;
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

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: user.tag,
				iconURL: user.displayAvatarURL({
					size: 512,
					dynamic: true,
					format: "png"
				})
			})
			.setThumbnail(user.displayAvatarURL({
				dynamic: true
			}))
			.addField(":man: " + message.translate("common:USERNAME"), user.username, true)
			.addField(this.client.customEmojis.discriminator + " " + message.translate("common:DISCRIMINATOR"), user.discriminator, true)
			.addField(this.client.customEmojis.bot + " " + message.translate("common:ROBOT"), (user.bot ? message.translate("common:YES") : message.translate("common:NO")), true)
			.addField(this.client.customEmojis.calendar + " " + message.translate("common:CREATION"), message.printDate(user.createdAt), true)
			.addField(this.client.customEmojis.avatar + " " + message.translate("common:AVATAR"), user.displayAvatarURL({
				size: 512,
				dynamic: true,
				format: "png"
			}))
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		if (displayPresence) {
			if (member.presence.activities[0].name === "Custom Status") {
				embed.addField(this.client.customEmojis.games + " " + message.translate("common:GAME"), (member.presence.activities[0] ? `Пользовательский статус\n${member.presence.activities[0].state || message.translate("common:NOT_DEFINED")}` : message.translate("general/userinfo:NO_GAME")), true);
				embed.addField(this.client.customEmojis.status[member.presence.status] + " " + message.translate("common:STATUS"), message.translate("common:STATUS_" + (member.presence.status.toUpperCase())), true);
			} else {
				embed.addField(this.client.customEmojis.games + " " + message.translate("common:GAME"), (member.presence.activities[0] ? `${member.presence.activities[0].name}\n${member.presence.activities[0].details}\n${member.presence.activities[0].state}` : message.translate("general/userinfo:NO_GAME")), true);
				embed.addField(this.client.customEmojis.status[member.presence.status] + " " + message.translate("common:STATUS"), message.translate("common:STATUS_" + (member.presence.status.toUpperCase())), true);
			}
		}

		if (member) {
			// embed.addField(this.client.customEmojis.up + " " + message.translate("general/userinfo:ROLE"), (member.roles.highest ? member.roles.highest : message.translate("general/userinfo:NO_ROLE")), true)
			embed.addField(this.client.customEmojis.calendar2 + " " + message.translate("common:JOIN"), message.printDate(member.joinedAt), true);
			embed.addField(this.client.customEmojis.color + " " + message.translate("common:COLOR"), member.displayHexColor, true);
			embed.addField(this.client.customEmojis.pencil + " " + message.translate("common:NICKNAME"), (member.nickname ? member.nickname : message.translate("general/userinfo:NO_NICKNAME")), true);
			embed.addField(this.client.customEmojis.roles + " " + message.translate("common:ROLES"), (member.roles.size > 10 ? member.roles.cache.map((r) => r).slice(0, 9).join(", ") + " " + message.translate("general/userinfo:MORE_ROLES", {
				count: member.roles.cache.size - 10
			}) : (member.roles.cache.size < 1) ? message.translate("general/userinfo:NO_ROLE") : member.roles.cache.map((r) => r).join(", ")));
		}

		if (user.bot && this.client.config.apiKeys.dbl && (this.client.config.apiKeys.dbl !== "")) {
			const res = await fetch("https://discordbots.org/api/bots/" + user.id, {
				headers: {
					"Authorization": this.client.config.apiKeys.dbl
				}
			});
			const data = await res.json();
			if (!data.error) {
				embed.addField(this.client.customEmojis.desc + " " + message.translate("common:DESCRIPTION"), data.shortdesc, true)
					.addField(this.client.customEmojis.stats + " " + message.translate("common:STATS"), message.translate("general/userinfo:BOT_STATS", {
						votes: data.monthlyPoints || 0,
						servers: data.server_count || 0,
						shards: (data.shards || [0]).length,
						lib: data.lib || "unknown"
					}), true)
					.addField(this.client.customEmojis.link + " " + message.translate("common:LINKS"), `${data.support ? `[${message.translate("common:SUPPORT")}](${data.support}) | ` : ""}${data.invite ?  `[${message.translate("common:INVITE")}](${data.invite}) | ` : ""}${data.github ?  `[GitHub](${data.github}) | ` : ""}${data.website ?  `[${message.translate("common:WEBSITE")}](${data.website})` : ""}`, true);
			}
		}

		message.channel.send({
			embeds: [embed]
		});
	}
}

module.exports = Userinfo;