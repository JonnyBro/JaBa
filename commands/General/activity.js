const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Activity extends Command {
	constructor(client) {
		super(client, {
			name: "activity",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["act"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const voice = message.member.voice.channel;
		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");

		const perms = voice.permissionsFor(this.client.user);
		if (!perms.has(Discord.Permissions.FLAGS.CONNECT) || !perms.has(Discord.Permissions.FLAGS.SPEAK)) return message.error("music/play:VOICE_CHANNEL_CONNECT");

		const activities = ["awkword", "betrayal", "checkers", "chess", "sketchheads", "fishing", "lettertile", "poker", "spellcast", "wordsnack", "puttparty", "youtube"];
		const activity = args[0];

		switch (activity) {
			case "awkword":
				message.reply("Не работает!");
				// this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "awkword").then(async invite => {
				// 	const embed = new Discord.MessageEmbed()
				// 		.setTitle("Awkword")
				// 		.setColor(data.config.embed.color)
				// 		.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Awkword", channel: voice.name })}](${invite.code})**`)
				// 		.setFooter({
				// 			text: message.translate("general/activity:FOOTER")
				// 		})
				// 		.setTimestamp();
				// 	return message.reply({
				// 		embeds: [embed]
				// 	});
				// });
				break;

			case "betrayal":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "betrayal").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Betrayal.io")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Betrayal.io", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "checkers":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "checkers").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Checkers In The Park")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Checkers In The Park", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "chess":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "chess").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Chess In The Park")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Chess In The Park", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "sketchheads":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "sketchheads").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Sketch Heads")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Sketch Heads", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "fishing":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "fishing").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Fishington.io")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Fishington.io", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "lettertile":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "lettertile").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Letter Tile")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Letter Tile", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "poker":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "poker").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Poker Night")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Poker Night", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "spellcast":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "spellcast").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Spell Cast")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Spell Cast", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "wordsnack":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "wordsnack").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Words Snack")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Words Snack", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "puttparty":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "puttparty").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Puttparty")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Puttparty", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			case "youtube":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelId, "youtube").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Youtube Together")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Youtube Together", channel: voice.name })}](${invite.code})**`)
						.setFooter({
							text: message.translate("general/activity:FOOTER")
						})
						.setTimestamp();
					return message.reply({
						embeds: [embed]
					});
				});
				break;

			default: {
				const embed = new Discord.MessageEmbed()
					.setTitle(message.translate("general/activity:TITLE"))
					.setDescription(activities.join("\n"))
					.setColor(data.config.embed.color)
					.setFooter({
						text: message.translate("general/activity:FOOTER")
					})
					.setTimestamp();
				message.reply({
					embeds: [embed]
				});
			}
		}
	}
}

module.exports = Activity;