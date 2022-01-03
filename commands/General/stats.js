const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Stats extends Command {
	constructor(client) {
		super(client, {
			name: "stats",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: [],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const statsEmbed = new Discord.MessageEmbed()
			.setColor(data.config.embed.color)
			.setFooter(data.config.embed.footer)
			.setAuthor(message.translate("common:STATS"))
			.setDescription(message.translate("general/stats:MADE"))
			.addField(this.client.customEmojis.stats + " " + message.translate("general/stats:COUNTS_TITLE"), message.translate("general/stats:COUNTS_CONTENT", {
				servers: this.client.guilds.cache.size,
				users: this.client.users.cache.size
			}), true)
			.addField(this.client.customEmojis.version + " " + message.translate("general/stats:VERSIONS_TITLE"), `\`Discord.js : v${Discord.version}\`\n\`Nodejs : v${process.versions.node}\``, true)
			.addField(this.client.customEmojis.ram + " " + message.translate("general/stats:RAM_TITLE"), `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\``, true)
			.addField(this.client.customEmojis.status.online + " " + message.translate("general/stats:ONLINE_TITLE"), message.translate("general/stats:ONLINE_CONTENT", {
				time: message.convertTime(Date.now() + this.client.uptime, "from", true)
			}))
			.addField(this.client.customEmojis.voice + " " + message.translate("general/stats:MUSIC_TITLE"), message.translate("general/stats:MUSIC_CONTENT", {
				count: `${this.client.player.voices.collection.size} ${message.getNoun(this.client.player.voices.collection.size, message.translate("misc:NOUNS:SERVERS:1"), message.translate("misc:NOUNS:SERVERS:2"), message.translate("misc:NOUNS:SERVERS:5"))}`
			}))
			.addField(message.translate("general/stats:CREDITS_TITLE"), message.translate("general/stats:CREDITS_CONTENT", {
				donators: [":("].join("\n"),
				translators: ["`Jonny_Bro#4226` (:flag_ru:)", "`[ДАННЫЕ УДАЛЕНЫ]#2789` (:flag_ua:)", "`FaxoNfuckyou#9398` и `Jonny_Bro#4226` (:flag_us:)"].join("\n")
			}));

		statsEmbed.addField(this.client.customEmojis.link + " " + message.translate("general/stats:LINKS_TITLE"), message.translate("misc:STATS_FOOTER", {
			dashboardLink: "https://jaba.pp.ua/",
			docsLink: "https://jaba.pp.ua/docs/",
			donateLink: "https://qiwi.com/n/JONNYBRO/",
			owner: this.client.config.owner.id
		}));
		message.channel.send(statsEmbed);
	}
};

module.exports = Stats;