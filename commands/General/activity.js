const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Activity extends Command {
	constructor (client) {
		super(client, {
			name: "activity",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run (message, args, data) {
		const voice = message.member.voice.channel;
		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");

		const perms = voice.permissionsFor(this.client.user);
		if (!perms.has("CONNECT") || !perms.has("SPEAK")) return message.error("music/play:VOICE_CHANNEL_CONNECT");
		// "awkword" - disabled
		const activities = ["betrayal", "checkers", "chess", "doodlecrew", "fishing", "lettertile", "poker", "spellcast", "wordsnack", "youtube"];
		const activity = args[0];

		switch (activity) {
			// Disabled for now
			// case "awkword":
			// 	this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "awkword").then(async invite => {
			// 		const embed = new Discord.MessageEmbed()
			// 			.setTitle("Awkword")
			// 			.setColor(data.config.embed.color)
			// 			.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Awkword", channel: voice.name })}](${invite.code})**`)
			// 			.setFooter(message.translate("general/activity:FOOTER"))
			// 			.setTimestamp()
			// 		return message.channel.send(embed);
			// 	});
			// break;

			case "betrayal":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "betrayal").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Betrayal.io")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Betrayal.io", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			case "checkers":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "checkers").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Checkers In The Park")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Checkers In The Park", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			case "chess":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "chess").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Chess In The Park")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Chess In The Park", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			case "doodlecrew":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "doodlecrew").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Doodle Crew")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Doodle Crew", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			case "fishing":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "fishing").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Fishington.io")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Fishington.io", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			case "lettertile":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "lettertile").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Letter Tile")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Letter Tile", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			case "poker":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "poker").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Poker Night")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Poker Night", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			case "spellcast":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "spellcast").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Spell Cast")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Spell Cast", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			case "wordsnack":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "wordsnack").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Words Snack")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Words Snack", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			case "youtube":
				this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "youtube").then(async invite => {
					const embed = new Discord.MessageEmbed()
						.setTitle("Youtube Together")
						.setColor(data.config.embed.color)
						.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Youtube Together", channel: voice.name })}](${invite.code})**`)
						.setFooter(message.translate("general/activity:FOOTER"))
						.setTimestamp()
					return message.channel.send(embed);
				});
			break;

			default:
				const embed = new Discord.MessageEmbed()
					.setTitle(message.translate("general/activity:TITLE"))
					.setDescription(activities.join("\n"))
					.setColor(data.config.embed.color)
					.setFooter(message.translate("general/activity:FOOTER"))
					.setTimestamp()
				message.channel.send(embed);
			break;
		}
	}
};

module.exports = Activity;