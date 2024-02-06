const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Userinfo extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("userinfo")
				.setDescription(client.translate("general/userinfo:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/userinfo:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/userinfo:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
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
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		const member = interaction.options.getMember("user") || interaction.member;

		const embed = client.embed({
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
					name: client.customEmojis.pencil + " " + interaction.translate("common:NICKNAME"),
					value: member.nickname || interaction.translate("general/userinfo:NO_NICKNAME"),
					inline: true,
				},
				{
					name: client.customEmojis.bot + " " + interaction.translate("common:ROBOT"),
					value: member.user.bot ? interaction.translate("common:YES") : interaction.translate("common:NO"),
					inline: true,
				},
				{
					name: client.customEmojis.calendar + " " + interaction.translate("common:CREATION"),
					value: `<t:${member.user.createdTimestamp}:D>`,
					inline: true,
				},
				{
					name: client.customEmojis.calendar2 + " " + interaction.translate("common:JOINED"),
					value: `<t:${member.joinedTimestamp}:D>`,
					inline: true,
				},
				{
					name: client.customEmojis.color + " " + interaction.translate("common:COLOR"),
					value: member.displayHexColor,
					inline: true,
				},
				{
					name: client.customEmojis.roles + " " + interaction.translate("common:ROLES"),
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

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Userinfo;
