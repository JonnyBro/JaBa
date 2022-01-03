const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Serverinfo extends Command {
	constructor(client) {
		super(client, {
			name: "serverinfo",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["si"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		let guild = message.guild;

		if (args[0]) {
			let found = this.client.guilds.cache.get(args[0]);
			if (!found) {
				found = this.client.guilds.cache.find(g => g.name.includes(args.join(" ")) || g.id === args[0]);
				if (found) guild = found;
			};
		};

		await guild.members.fetch();

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL({
					dynamic: true
				})
			})
			.setThumbnail(guild.iconURL({
				dynamic: true
			}))
			.addField(this.client.customEmojis.title + message.translate("common:NAME"), guild.name, true)
			.addField(this.client.customEmojis.calendar + message.translate("common:CREATION"), message.printDate(guild.createdAt), true)
			.addField(this.client.customEmojis.users + message.translate("common:MEMBERS"),
				`${guild.members.cache.filter(m => !m.user.bot).size} ${message.getNoun(guild.members.cache.filter(m => !m.user.bot).size, message.translate("misc:NOUNS:MEMBERS:1"), message.translate("misc:NOUNS:MEMBERS:2"), message.translate("misc:NOUNS:MEMBERS:5"))}` +
				"\n" + `${guild.members.cache.filter(m => m.user.bot).size} ${message.getNoun(guild.members.cache.filter(m => m.user.bot).size, message.translate("misc:NOUNS:BOTS:1"), message.translate("misc:NOUNS:BOTS:2"), message.translate("misc:NOUNS:BOTS:5"))}`, true
			)
			.addField(this.client.customEmojis.afk + message.translate("general/serverinfo:AFK_CHANNEL"), guild.afkChannel || message.translate("general/serverinfo:NO_AFK_CHANNEL"), true)
			.addField(this.client.customEmojis.id + message.translate("common:ID"), guild.id, true)
			.addField(this.client.customEmojis.crown + message.translate("common:OWNER"), guild.owner, true)
			.addField(this.client.customEmojis.boost + message.translate("general/serverinfo:BOOSTS"), guild.premiumSubscriptionCount || 0, true)
			.addField(this.client.customEmojis.channels + message.translate("common:CHANNELS"),
				`${guild.channels.cache.filter(c => c.type === "GUILD_TEXT").size} ${message.getNoun(guild.channels.cache.filter(c => c.type === "GUILD_TEXT").size, message.translate("misc:NOUNS:TEXT:1"), message.translate("misc:NOUNS:TEXT:2"), message.translate("misc:NOUNS:TEXT:5"))}` +
				"\n" + `${guild.channels.cache.filter(c => c.type === "GUILD_VOICE").size} ${message.getNoun(guild.channels.cache.filter(c => c.type === "GUILD_VOICE").size, message.translate("misc:NOUNS:VOICE:1"), message.translate("misc:NOUNS:VOICE:2"), message.translate("misc:NOUNS:VOICE:5"))}` +
				"\n" + `${guild.channels.cache.filter(c => c.type === "GUILD_CATEGORY").size} ${message.getNoun(guild.channels.cache.filter(c => c.type === "GUILD_CATEGORY").size, message.translate("misc:NOUNS:CATEGORY:1"), message.translate("misc:NOUNS:CATEGORY:2"), message.translate("misc:NOUNS:CATEGORY:5"))}`, true
			)
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		message.channel.send({
			embeds: [embed]
		});
	}
};

module.exports = Serverinfo;