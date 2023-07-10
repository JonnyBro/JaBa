const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Serverinfo extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("serverinfo")
				.setDescription(client.translate("general/serverinfo:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/serverinfo:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/serverinfo:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
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
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		const guild = interaction.guild;

		await guild.members.fetch();
		const owner = await guild.fetchOwner();

		const embed = new EmbedBuilder()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL(),
			})
			.setThumbnail(guild.iconURL())
			.addFields([
				{
					name: client.customEmojis.link + " " + interaction.translate("general/serverinfo:LINK"),
					value: `[${interaction.translate("general/serverinfo:LINK_TEXT")}](${client.config.dashboard.domain}/stats/${guild.id})`,
				},
				{
					name: client.customEmojis.title + interaction.translate("common:NAME"),
					value: guild.name,
					inline: true,
				},
				{
					name: client.customEmojis.calendar + interaction.translate("common:CREATION"),
					value: client.functions.printDate(client, guild.createdAt, null, data.guildData.language),
					inline: true,
				},
				{
					name: client.customEmojis.users + interaction.translate("common:MEMBERS"),
					value:
						`${guild.members.cache.filter(m => !m.user.bot).size} ${client.functions.getNoun(
							guild.members.cache.filter(m => !m.user.bot).size,
							interaction.translate("misc:NOUNS:MEMBERS:1"),
							interaction.translate("misc:NOUNS:MEMBERS:2"),
							interaction.translate("misc:NOUNS:MEMBERS:5"),
						)}` +
						"\n" +
						`${guild.members.cache.filter(m => m.user.bot).size} ${client.functions.getNoun(
							guild.members.cache.filter(m => m.user.bot).size,
							interaction.translate("misc:NOUNS:BOTS:1"),
							interaction.translate("misc:NOUNS:BOTS:2"),
							interaction.translate("misc:NOUNS:BOTS:5"),
						)}`,
					inline: true,
				},
				{
					name: client.customEmojis.afk + interaction.translate("general/serverinfo:AFK_CHANNEL"),
					value: guild.afkChannel?.toString() || interaction.translate("common:MISSING"),
					inline: true,
				},
				{
					name: client.customEmojis.id + interaction.translate("common:SERVER_ID"),
					value: guild.id,
					inline: true,
				},
				{
					name: client.customEmojis.crown + interaction.translate("common:OWNER"),
					value: owner.toString(),
					inline: true,
				},
				{
					name: client.customEmojis.boost + interaction.translate("general/serverinfo:BOOSTS"),
					value: guild.premiumSubscriptionCount?.toString() || "0",
					inline: true,
				},
				{
					name: client.customEmojis.channels + interaction.translate("common:CHANNELS"),
					value:
						`${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size} ${client.functions.getNoun(
							guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size,
							interaction.translate("misc:NOUNS:TEXT:1"),
							interaction.translate("misc:NOUNS:TEXT:2"),
							interaction.translate("misc:NOUNS:TEXT:5"),
						)}` +
						"\n" +
						`${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size} ${client.functions.getNoun(
							guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size,
							interaction.translate("misc:NOUNS:VOICE:1"),
							interaction.translate("misc:NOUNS:VOICE:2"),
							interaction.translate("misc:NOUNS:VOICE:5"),
						)}` +
						"\n" +
						`${guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size} ${client.functions.getNoun(
							guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size,
							interaction.translate("misc:NOUNS:CATEGORY:1"),
							interaction.translate("misc:NOUNS:CATEGORY:2"),
							interaction.translate("misc:NOUNS:CATEGORY:5"),
						)}`,
					inline: true,
				},
			])

			.setColor(client.config.embed.color)
			.setFooter(client.config.embed.footer);

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Serverinfo;
