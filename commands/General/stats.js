const { SlashCommandBuilder, PermissionsBitField, version: djsVersion } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Stats extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("stats")
				.setDescription(client.translate("general/stats:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/stats:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/stats:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		const hiddenGuildMembersCount = client.guilds.cache.get("568120814776614924").memberCount;
		const servers = client.guilds.cache.size - 1;
		let users = 0;
		client.guilds.cache.forEach(g => {
			users += g.memberCount;
		});
		users = users - hiddenGuildMembersCount;

		const embed = client.embed({
			author: interaction.translate("common:STATS"),
			descirption: interaction.translate("general/stats:MADE"),
			fields: [
				{
					name: client.customEmojis.stats + " " + interaction.translate("general/stats:COUNTS_TITLE"),
					value: interaction.translate("general/stats:COUNTS_CONTENT", {
						servers: servers,
						users: users,
					}),
					inline: true,
				},
				{
					name: client.customEmojis.version + " " + interaction.translate("general/stats:VERSIONS_TITLE"),
					value: `\`Discord.js: v${djsVersion}\`\n\`Nodejs: v${process.versions.node}\``,
					inline: true,
				},
				{
					name: client.customEmojis.ram + " " + interaction.translate("general/stats:RAM_TITLE"),
					value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\``,
					inline: true,
				},
				{
					name: client.customEmojis.status.online + " " + interaction.translate("general/stats:ONLINE_TITLE"),
					value: interaction.translate("general/stats:ONLINE_CONTENT", {
						time: `<t:${Math.floor((Date.now() + client.uptime) / 1000)}:R>`,
					}),
				},
				{
					name: client.customEmojis.voice + " " + interaction.translate("general/stats:MUSIC_TITLE"),
					value: interaction.translate("general/stats:MUSIC_CONTENT", {
						count: `${client.player.nodes.cache.size} ${client.functions.getNoun(
							client.player.nodes.cache.size,
							interaction.translate("misc:NOUNS:SERVERS:1"),
							interaction.translate("misc:NOUNS:SERVERS:2"),
							interaction.translate("misc:NOUNS:SERVERS:5"),
						)}`,
					}),
				},
				{
					name: interaction.translate("general/stats:CREDITS_TITLE"),
					value: interaction.translate("general/stats:CREDITS_CONTENT"),
				},
				{
					name: client.customEmojis.link + " " + interaction.translate("general/stats:LINKS_TITLE"),
					value: interaction.translate("misc:STATS_FOOTER", {
						dashboardLink: client.config.dashboard.domain,
						supportLink: "https://discord.gg/Ptkj2n9nzZ",
						inviteLink: client.generateInvite({ scopes: ["bot", "applications.commands"], permissions: [PermissionsBitField.Flags.Administrator] }),
						donateLink: "https://www.donationalerts.com/r/jonny_bro",
						owner: client.config.owner.id,
					}),
				},
			],
		});

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Stats;
