const Command = require("../../base/Command"),
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
			}
		}

		await guild.members.fetch();
		const owner = await guild.fetchOwner();

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL()
			})
			.setThumbnail(guild.iconURL())
			.addFields([
				{
					name: this.client.customEmojis.link + " " + message.translate("general/serverinfo:LINK"),
					value: `[${message.translate("general/serverinfo:LINK_TEXT")}](${this.client.config.dashboard.baseURL}/stats/${guild.id})`
				},
				{
					name: this.client.customEmojis.title + message.translate("common:NAME"),
					value: guild.name,
					inline: true
				},
				{
					name: this.client.customEmojis.calendar + message.translate("common:CREATION"),
					value: this.client.printDate(guild.createdAt),
					inline: true
				},
				{
					name: this.client.customEmojis.users + message.translate("common:MEMBERS"),
					value: `${guild.members.cache.filter(m => !m.user.bot).size} ${message.getNoun(guild.members.cache.filter(m => !m.user.bot).size, message.translate("misc:NOUNS:MEMBERS:1"), message.translate("misc:NOUNS:MEMBERS:2"), message.translate("misc:NOUNS:MEMBERS:5"))}` +
						"\n" + `${guild.members.cache.filter(m => m.user.bot).size} ${message.getNoun(guild.members.cache.filter(m => m.user.bot).size, message.translate("misc:NOUNS:BOTS:1"), message.translate("misc:NOUNS:BOTS:2"), message.translate("misc:NOUNS:BOTS:5"))}`,
					inline: true
				},
				{
					name: this.client.customEmojis.afk + message.translate("general/serverinfo:AFK_CHANNEL"),
					value: guild.afkChannel ? guild.afkChannel.toString() : message.translate("general/serverinfo:NO_AFK_CHANNEL"),
					inline: true
				},
				{
					name: this.client.customEmojis.id + message.translate("common:ID"),
					value: guild.id,
					inline: true
				},
				{
					name: this.client.customEmojis.crown + message.translate("common:OWNER"),
					value: owner.toString(),
					inline: true
				},
				{
					name: this.client.customEmojis.boost + message.translate("general/serverinfo:BOOSTS"),
					value: guild.premiumSubscriptionCount.toString() || "0",
					inline: true
				},
				{
					name: this.client.customEmojis.channels + message.translate("common:CHANNELS"),
					value: `${guild.channels.cache.filter(c => c.type === "GUILD_TEXT").size} ${message.getNoun(guild.channels.cache.filter(c => c.type === "GUILD_TEXT").size, message.translate("misc:NOUNS:TEXT:1"), message.translate("misc:NOUNS:TEXT:2"), message.translate("misc:NOUNS:TEXT:5"))}` +
						"\n" + `${guild.channels.cache.filter(c => c.type === "GUILD_VOICE").size} ${message.getNoun(guild.channels.cache.filter(c => c.type === "GUILD_VOICE").size, message.translate("misc:NOUNS:VOICE:1"), message.translate("misc:NOUNS:VOICE:2"), message.translate("misc:NOUNS:VOICE:5"))}` +
						"\n" + `${guild.channels.cache.filter(c => c.type === "GUILD_CATEGORY").size} ${message.getNoun(guild.channels.cache.filter(c => c.type === "GUILD_CATEGORY").size, message.translate("misc:NOUNS:CATEGORY:1"), message.translate("misc:NOUNS:CATEGORY:2"), message.translate("misc:NOUNS:CATEGORY:5"))}`,
					inline: true
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

module.exports = Serverinfo;