const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Userinfo extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("userinfo")
				.setDescription(client.translate("general/userinfo:DESCRIPTION"))
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))),
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
		const member = interaction.options.getMember("user") || interaction.member;
		const embed = new EmbedBuilder()
			.setAuthor({
				name: `${member.user.tag} (${member.id})`,
				iconURL: member.displayAvatarURL({
					size: 512
				})
			})
			.setThumbnail(member.displayAvatarURL({
				size: 512
			}))
			.addFields([
				{
					name: ":man: " + interaction.translate("common:USERNAME"),
					value: member.user.tag,
					inline: true
				},
				{
					name: client.customEmojis.pencil + " " + interaction.translate("common:NICKNAME"),
					value: member.nickname || interaction.translate("general/userinfo:NO_NICKNAME"),
					inline: true
				},
				{
					name: client.customEmojis.status[member.presence.status] + " " + interaction.translate("common:STATUS"),
					value: interaction.translate(`common:STATUS_${member.presence.status.toUpperCase()}`),
					inline: true
				},
				{
					name: client.customEmojis.bot + " " + interaction.translate("common:ROBOT"),
					value: member.user.bot ? interaction.translate("common:YES") : interaction.translate("common:NO"),
					inline: true
				},
				{
					name: client.customEmojis.calendar + " " + interaction.translate("common:CREATION"),
					value: client.printDate(member.user.createdAt),
					inline: true
				},
				{
					name: client.customEmojis.calendar2 + " " + interaction.translate("common:JOIN"),
					value: client.printDate(member.joinedAt),
					inline: true
				},
				{
					name: client.customEmojis.color + " " + interaction.translate("common:COLOR"),
					value: member.displayHexColor,
					inline: true
				},
				{
					name: client.customEmojis.roles + " " + interaction.translate("common:ROLES"),
					value: (member.roles.size > 10 ? member.roles.cache.map((r) => r).slice(0, 10).join(", ") + " " + interaction.translate("general/userinfo:MORE_ROLES", {
						count: member.roles.cache.size - 10
					}) : (member.roles.cache.size < 1) ? interaction.translate("general/userinfo:NO_ROLE") : member.roles.cache.map((r) => r).join(", ")),
					inline: true
				}
			])
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			});

		if (member.presence.activities[0].name === "Custom Status") {
			embed.addFields([
				{
					name: client.customEmojis.games + " " + interaction.translate("common:ACTIVITY"),
					value: member.presence.activities[0] ? `${interaction.translate("general/userinfo:CUSTOM")}\n${member.presence.activities[0].state || interaction.translate("common:NOT_DEFINED")}` : interaction.translate("general/userinfo:NO_ACTIVITY"),
					inline: true
				}
			]);
		} else {
			embed.addFields([
				{
					name: client.customEmojis.games + " " + interaction.translate("common:ACTIVITY"),
					value: member.presence.activities[0] ? `${member.presence.activities[0].name}\n${member.presence.activities[0].details}\n${member.presence.activities[0].state}` : interaction.translate("general/userinfo:NO_GAME"),
					inline: true
				}
			]);
		}

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Userinfo;