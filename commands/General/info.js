const { SlashCommandBuilder, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Info extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("info")
				.setDescription(client.translate("general/info:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/info:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/info:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addSubcommand(subcommand =>
					subcommand
						.setName("user")
						.setDescription(client.translate("general/info:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("general/info:USER", null, "uk-UA"),
							ru: client.translate("general/info:USER", null, "ru-RU"),
						})
						.addUserOption(option =>
							option
								.setName("user")
								.setDescription(client.translate("common:USER"))
								.setDescriptionLocalizations({
									uk: client.translate("common:USER", null, "uk-UA"),
									ru: client.translate("common:USER", null, "ru-RU"),
								}),
						),
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName("server")
						.setDescription(client.translate("general/info:SERVER"))
						.setDescriptionLocalizations({
							uk: client.translate("general/info:SERVER", null, "uk-UA"),
							ru: client.translate("general/info:SERVER", null, "ru-RU"),
						}),
				),
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
		await interaction.deferReply();

		const command = interaction.options.getSubcommand();

		if (command === "user") {
			const member = interaction.options.getMember("user") || interaction.member;
			const embed = getUserInfo(interaction, member);

			return interaction.editReply({
				embeds: [embed],
			});
		} else {
			const embed = await getServerInfo(interaction);

			return interaction.editReply({
				embeds: [embed],
			});
		}
	}
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @returns {Promise<import("discord.js").Embed>} Embed containing information about the guild
 */
async function getServerInfo(interaction) {
	const { guild } = interaction;

	await guild.members.fetch();
	const owner = await guild.fetchOwner();

	const embed = interaction.client.embed({
		author: guild.name,
		thumbnail: guild.iconURL(),
		fields: [
			{
				name: interaction.client.customEmojis.title + interaction.translate("common:NAME"),
				value: guild.name,
				inline: true,
			},
			{
				name: interaction.client.customEmojis.calendar + interaction.translate("common:CREATION"),
				value: `<t:${guild.createdTimestamp}:D>`,
				inline: true,
			},
			{
				name: interaction.client.customEmojis.users + interaction.translate("common:MEMBERS"),
				value:
					`${guild.members.cache.filter(m => !m.user.bot).size} ${interaction.client.functions.getNoun(
						guild.members.cache.filter(m => !m.user.bot).size,
						interaction.translate("misc:NOUNS:MEMBERS:1"),
						interaction.translate("misc:NOUNS:MEMBERS:2"),
						interaction.translate("misc:NOUNS:MEMBERS:5"),
					)}` +
					"\n" +
					`${guild.members.cache.filter(m => m.user.bot).size} ${interaction.client.functions.getNoun(
						guild.members.cache.filter(m => m.user.bot).size,
						interaction.translate("misc:NOUNS:BOTS:1"),
						interaction.translate("misc:NOUNS:BOTS:2"),
						interaction.translate("misc:NOUNS:BOTS:5"),
					)}`,
				inline: true,
			},
			{
				name: interaction.client.customEmojis.afk + interaction.translate("general/serverinfo:AFK_CHANNEL"),
				value: guild.afkChannel?.toString() || interaction.translate("common:MISSING"),
				inline: true,
			},
			{
				name: interaction.client.customEmojis.id + interaction.translate("common:SERVER_ID"),
				value: guild.id,
				inline: true,
			},
			{
				name: interaction.client.customEmojis.crown + interaction.translate("common:OWNER"),
				value: owner.toString(),
				inline: true,
			},
			{
				name: interaction.client.customEmojis.boost + interaction.translate("general/serverinfo:BOOSTS"),
				value: guild.premiumSubscriptionCount?.toString() || "0",
				inline: true,
			},
			{
				name: interaction.client.customEmojis.channels + interaction.translate("common:CHANNELS"),
				value:
					`${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size} ${interaction.client.functions.getNoun(
						guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size,
						interaction.translate("misc:NOUNS:TEXT:1"),
						interaction.translate("misc:NOUNS:TEXT:2"),
						interaction.translate("misc:NOUNS:TEXT:5"),
					)}` +
					"\n" +
					`${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size} ${interaction.client.functions.getNoun(
						guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size,
						interaction.translate("misc:NOUNS:VOICE:1"),
						interaction.translate("misc:NOUNS:VOICE:2"),
						interaction.translate("misc:NOUNS:VOICE:5"),
					)}` +
					"\n" +
					`${guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size} ${interaction.client.functions.getNoun(
						guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size,
						interaction.translate("misc:NOUNS:CATEGORY:1"),
						interaction.translate("misc:NOUNS:CATEGORY:2"),
						interaction.translate("misc:NOUNS:CATEGORY:5"),
					)}`,
				inline: true,
			},
		],
	});

	return embed;
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {import("discord.js").Member} member
 * @returns {import("discord.js").Embed} Embed containing information about the user
 */
function getUserInfo(interaction, member) {
	const embed = interaction.client.embed({
		author: {
			name: `${member.user.getUsername()} (${member.id})`,
			iconURL: member.displayAvatarURL(),
		},
		thumbnail: member.displayAvatarURL(),
		fields: [
			{
				name: ":man: " + interaction.translate("common:USERNAME"),
				value: member.user.getUsername(),
				inline: true,
			},
			{
				name: interaction.client.customEmojis.pencil + " " + interaction.translate("common:NICKNAME"),
				value: member.nickname || interaction.translate("general/userinfo:NO_NICKNAME"),
				inline: true,
			},
			{
				name: interaction.client.customEmojis.bot + " " + interaction.translate("common:ROBOT"),
				value: member.user.bot ? interaction.translate("common:YES") : interaction.translate("common:NO"),
				inline: true,
			},
			{
				name: interaction.client.customEmojis.calendar + " " + interaction.translate("common:CREATION"),
				value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`,
				inline: true,
			},
			{
				name: interaction.client.customEmojis.calendar2 + " " + interaction.translate("common:JOINED"),
				value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`,
				inline: true,
			},
			{
				name: interaction.client.customEmojis.color + " " + interaction.translate("common:COLOR"),
				value: member.displayHexColor,
				inline: true,
			},
			{
				name: interaction.client.customEmojis.roles + " " + interaction.translate("common:ROLES"),
				value:
					member.roles.size > 10
						? member.roles.cache.map(r => r).filter(r => r.id !== interaction.guild.roles.everyone.id).slice(0, 10).join(", ") + " " +
					interaction.translate("general/userinfo:MORE_ROLES", {
						count: member.roles.cache.size - 10,
					})
						: member.roles.cache.size < 1 ? interaction.translate("general/userinfo:NO_ROLE") : member.roles.cache.map(r => r).filter(r => r.id !== interaction.guild.roles.everyone.id).slice(0, 10).join(", "),
				inline: true,
			},
		],
	});

	return embed;
}

module.exports = Info;
