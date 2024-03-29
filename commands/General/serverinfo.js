const { SlashCommandBuilder, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Serverinfo extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
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
		const { guild } = interaction;

		await guild.members.fetch();
		const owner = await guild.fetchOwner();

		const embed = client.embed({
			author: guild.name,
			thumbnail: guild.iconURL(),
			fields: [
				{
					name: client.customEmojis.title + interaction.translate("common:NAME"),
					value: guild.name,
					inline: true,
				},
				{
					name: client.customEmojis.calendar + interaction.translate("common:CREATION"),
					value: `<t:${guild.createdTimestamp}:D>`,
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
			],
		});

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Serverinfo;
