const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Leaderboard extends Command {
	constructor(client) {
		super(client, {
			name: "leaderboard",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["lb"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const isOnlyOnMobile = (message.member.presence.clientStatus ? JSON.stringify(Object.keys(message.member.presence.clientStatus)) === JSON.stringify(["mobile"]) : false);

		const type = args[0];
		if (!type || !["credits", "level", "rep"].includes(type)) return message.error("economy/leaderboard:MISSING_TYPE");

		if (type === "credits") {
			const members = await this.client.membersData.find({
					guildID: message.guild.id
				}).lean(),
				membersLeaderboard = members.map((m) => {
					return {
						id: m.id,
						money: m.money + m.bankSold
					};
				}).sort((a, b) => b.money - a.money);
			if (membersLeaderboard.length > 20) membersLeaderboard.length = 20;

			let userNames = "";
			let money = "";
			for (let i = 0; i < membersLeaderboard.length; i++) {
				const data = membersLeaderboard[i];
				const user = (await this.client.users.fetch(data.id)).tag;

				userNames += `**${i + 1}**. ${user}\n`;
				money += `${data.money}\n`;
			}

			const embed = new Discord.MessageEmbed()
				.setAuthor({
					name: message.translate("economy/leaderboard:TABLE", {
						name: message.guild.name
					}),
					iconURL: message.guild.iconURL({
						dynamic: true
					})
				})
				.setColor(data.config.embed.color)
				.addFields({
					name: message.translate("economy/leaderboard:TOP"),
					value: userNames,
					inline: true
				}, {
					name: message.translate("economy/leaderboard:CREDITS"),
					value: money,
					inline: true
				});

			message.channel.send({
				embeds: [embed]
			});
		} else if (type === "level") {
			const members = await this.client.membersData.find({
					guildID: message.guild.id
				}).lean(),
				membersLeaderboard = members.map((m) => {
					return {
						id: m.id,
						level: m.level,
						xp: m.exp
					};
				}).sort((a, b) => b.level - a.level);
			if (membersLeaderboard.length > 20) membersLeaderboard.length = 20;

			let userNames = "";
			let level = "";
			let xp = "";
			for (let i = 0; i < membersLeaderboard.length; i++) {
				const data = membersLeaderboard[i];
				const user = (await this.client.users.fetch(data.id)).tag;

				userNames += `**${i + 1}**. ${user}\n`;
				level += `${data.level}\n`;
				xp += `${data.xp} / ${5 * (data.level * data.level) + 80 * data.level + 100}\n`;
			}

			const embed = new Discord.MessageEmbed()
				.setAuthor({
					name: message.translate("economy/leaderboard:TABLE", {
						name: message.guild.name
					}),
					iconURL: message.guild.iconURL({
						dynamic: true
					})
				})
				.setColor(data.config.embed.color)
				.addFields({
					name: message.translate("economy/leaderboard:TOP"),
					value: userNames,
					inline: true
				}, {
					name: message.translate("economy/leaderboard:LEVEL"),
					value: level,
					inline: true
				}, {
					name: message.translate("economy/leaderboard:XP"),
					value: xp,
					inline: true
				});

			message.channel.send({
				embeds: [embed]
			});
		} else if (type === "rep") {
			const users = await this.client.usersData.find({
					rep: { $gt: 0 }
				}).lean(),
				usersLeaderboard = users.map((u) => {
					return {
						id: u.id,
						rep: u.rep
					};
				}).sort((a, b) => b.rep - a.rep);
			if (usersLeaderboard.length > 20) usersLeaderboard.length = 20;

			let userNames = "";
			let rep = "";
			for (let i = 0; i < usersLeaderboard.length; i++) {
				const data = usersLeaderboard[i];
				const user = (await this.client.users.fetch(data.id)).tag;

				userNames += `**${i + 1}**. ${user}\n`;
				rep += `${data.rep}\n`;
			}

			const embed = new Discord.MessageEmbed()
				.setAuthor({
					name: message.translate("economy/leaderboard:TABLE", {
						name: message.guild.name
					}),
					iconURL: message.guild.iconURL({
						dynamic: true
					})
				})
				.setColor(data.config.embed.color)
				.addFields({
					name: message.translate("economy/leaderboard:TOP"),
					value: userNames,
					inline: true
				}, {
					name: message.translate("economy/leaderboard:REP"),
					value: rep,
					inline: true
				});

			message.channel.send({
				embeds: [embed]
			});
		}

		if (isOnlyOnMobile) message.sendT("economy/leaderboard:MOBILE");
	}
}

module.exports = Leaderboard;