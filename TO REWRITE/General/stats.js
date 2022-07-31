const Command = require("../../base/Command"),
	{ PermissionsBitField, EmbedBuilder, version } = require("discord.js");

class Stats extends Command {
	constructor(client) {
		super(client, {
			name: "stats",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["stat"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const hiddenGuild = await this.client.guilds.fetch("568120814776614924");
		const users = this.client.users.cache.size - hiddenGuild.memberCount;
		const servers = this.client.guilds.cache.size - 1;

		const statsEmbed = new EmbedBuilder()
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			})
			.setAuthor({
				name: message.translate("common:STATS")
			})
			.setDescription(message.translate("general/stats:MADE"))
			.addFields([
				{
					name: this.client.customEmojis.stats + " " + message.translate("general/stats:COUNTS_TITLE"),
					value: message.translate("general/stats:COUNTS_CONTENT", {
						servers: servers,
						users: users
					}),
					inline: true
				},
				{
					name: this.client.customEmojis.version + " " + message.translate("general/stats:VERSIONS_TITLE"),
					value: `\`Discord.js: v${version}\`\n\`Nodejs: v${process.versions.node}\``,
					inline: true
				},
				{
					name: this.client.customEmojis.ram + " " + message.translate("general/stats:RAM_TITLE"),
					value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\``,
					inline: true
				},
				{
					name: this.client.customEmojis.status.online + " " + message.translate("general/stats:ONLINE_TITLE"),
					value: message.translate("general/stats:ONLINE_CONTENT", {
						time: this.client.convertTime(Date.now() + this.client.uptime, true, true)
					})
				},
				{
					name: this.client.customEmojis.voice + " " + message.translate("general/stats:MUSIC_TITLE"),
					value: message.translate("general/stats:MUSIC_CONTENT", {
						count: `${this.client.player.voices.collection.size} ${message.getNoun(this.client.player.voices.collection.size, message.translate("misc:NOUNS:SERVERS:1"), message.translate("misc:NOUNS:SERVERS:2"), message.translate("misc:NOUNS:SERVERS:5"))}`
					})
				},
				{
					name: message.translate("general/stats:CREDITS_TITLE"),
					value: message.translate("general/stats:CREDITS_CONTENT", {
						donators: ["**`Добрый Спецназ#8801`** - Тестер, генератор идей"].join("\n"),
						translators: ["**`Jonny_Bro#4226`** - :flag_ru:", "**`[ДАННЫЕ УДАЛЕНЫ]#4507`** - :flag_ua: (НЕ ОБНОВЛЕН!)"].join("\n")
					})
				},
				{
					name: this.client.customEmojis.link + " " + message.translate("general/stats:LINKS_TITLE"),
					value: message.translate("misc:STATS_FOOTER", {
						dashboardLink: this.client.config.dashboard.baseURL,
						docsLink: `${this.client.config.dashboard.baseURL}/docs/`,
						inviteLink: this.client.generateInvite({ scopes: ["bot", "applications.commands"], permissions: [ PermissionsBitField.Flags.Administrator ] }),
						donateLink: "https://qiwi.com/n/JONNYBRO/",
						owner: data.config.owner.id
					})
				}
			]);

		message.reply({
			embeds: [statsEmbed]
		});
	}
}

module.exports = Stats;