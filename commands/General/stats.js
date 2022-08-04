
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, version } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Stats extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("stats")
				.setDescription(client.translate("general/stats:DESCRIPTION")),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: false
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const hiddenGuild = await client.guilds.fetch("568120814776614924");
		const users = client.users.cache.size - hiddenGuild.memberCount;
		const servers = client.guilds.cache.size - 1;

		const statsEmbed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			})
			.setAuthor({
				name: interaction.translate("common:STATS")
			})
			.setDescription(interaction.translate("general/stats:MADE"))
			.addFields([
				{
					name: client.customEmojis.stats + " " + interaction.translate("general/stats:COUNTS_TITLE"),
					value: interaction.translate("general/stats:COUNTS_CONTENT", {
						servers: servers,
						users: users
					}),
					inline: true
				},
				{
					name: client.customEmojis.version + " " + interaction.translate("general/stats:VERSIONS_TITLE"),
					value: `\`Discord.js: v${version}\`\n\`Nodejs: v${process.versions.node}\``,
					inline: true
				},
				{
					name: client.customEmojis.ram + " " + interaction.translate("general/stats:RAM_TITLE"),
					value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\``,
					inline: true
				},
				{
					name: client.customEmojis.status.online + " " + interaction.translate("general/stats:ONLINE_TITLE"),
					value: interaction.translate("general/stats:ONLINE_CONTENT", {
						time: client.convertTime(Date.now() + client.uptime, true, true)
					})
				},
				{
					name: client.customEmojis.voice + " " + interaction.translate("general/stats:MUSIC_TITLE"),
					value: interaction.translate("general/stats:MUSIC_CONTENT", {
						count: `${client.player.queues.size} ${client.getNoun(client.player.queues.size, interaction.translate("misc:NOUNS:SERVERS:1"), interaction.translate("misc:NOUNS:SERVERS:2"), interaction.translate("misc:NOUNS:SERVERS:5"))}`
					})
				},
				{
					name: interaction.translate("general/stats:CREDITS_TITLE"),
					value: interaction.translate("general/stats:CREDITS_CONTENT", {
						donators: ["**`Добрый Спецназ#8801`** - Тестер, генератор идей"].join("\n"),
						translators: ["**`[ДАННЫЕ УДАЛЕНЫ]#4507`** - :flag_ua: (НЕ ОБНОВЛЕН!)"].join("\n")
					})
				},
				{
					name: client.customEmojis.link + " " + interaction.translate("general/stats:LINKS_TITLE"),
					value: interaction.translate("misc:STATS_FOOTER", {
						dashboardLink: client.config.dashboard.baseURL,
						docsLink: `${client.config.dashboard.baseURL}/docs/`,
						inviteLink: client.generateInvite({ scopes: ["bot", "applications.commands"], permissions: [ PermissionsBitField.Flags.Administrator ] }),
						donateLink: "https://qiwi.com/n/JONNYBRO/",
						owner: client.config.owner.id
					})
				}
			]);

		interaction.reply({
			embeds: [statsEmbed]
		});
	}
}

module.exports = Stats;