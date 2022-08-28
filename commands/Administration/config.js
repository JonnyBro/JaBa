const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Config extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("config")
				.setDescription(client.translate("administration/config:DESCRIPTION"))
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
			aliases: [],
			dirname: __dirname,
			guildOnly: true
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
		const guildData = data.guildData;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.guild.name,
				iconURL: interaction.guild.iconURL()
			})
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			})
			.addFields([
				{
					name: interaction.translate("administration/config:WELCOME_TITLE"),
					value: guildData.plugins.welcome.enabled ? interaction.translate("administration/config:WELCOME_CONTENT", {
						channel: `<#${guildData.plugins.welcome.channel}>`,
						withImage: guildData.plugins.welcome.withImage ? interaction.translate("common:YES") : interaction.translate("common:NO")
					}) : interaction.translate("common:DISABLED"),
					inline: true
				},
				{
					name: interaction.translate("administration/config:GOODBYE_TITLE"),
					value: guildData.plugins.goodbye.enabled ? interaction.translate("administration/config:GOODBYE_CONTENT", {
						channel: `<#${guildData.plugins.goodbye.channel}>`,
						withImage: guildData.plugins.goodbye.withImage ? interaction.translate("common:YES") : interaction.translate("common:NO")
					}) : interaction.translate("common:DISABLED"),
					inline: true
				},
				{
					name: interaction.translate("administration/config:AUTOROLE_TITLE"),
					value: guildData.plugins.autorole.enabled ? `<@&${guildData.plugins.autorole.role}>`
						: interaction.translate("common:DISABLED")
				},
				{
					name: interaction.translate("administration/config:AUTO_SANCTIONS"),
					value: (guildData.plugins.warnsSanctions.kick ? interaction.translate("administration/config:KICK_CONTENT", {
						count: guildData.plugins.warnsSanctions.kick
					}) : interaction.translate("administration/config:KICK_NOT_DEFINED")) + "\n" + (guildData.plugins.warnsSanctions.ban ? interaction.translate("administration/config:BAN_CONTENT", {
						count: guildData.plugins.warnsSanctions.ban
					}) : interaction.translate("administration/config:BAN_NOT_DEFINED"))
				},
				{
					name: interaction.translate("administration/config:AUTOMOD_TITLE"),
					value: guildData.plugins.automod.enabled ? interaction.translate("administration/config:AUTOMOD_CONTENT", {
						channels: guildData.plugins.automod.ignored.map(ch => ` ${ch}`)
					}) : interaction.translate("common:DISABLED")
				},
				{
					name: interaction.translate("administration/config:SPECIAL_CHANNELS"),
					value: interaction.translate("administration/config:NEWS", {
						channel: guildData.plugins.news ? `<#${guildData.plugins.news}>` : `*${interaction.translate("common:NOT_DEFINED")}*`
					}) + "\n" +
					interaction.translate("administration/config:SUGGESTIONS", {
						channel: guildData.plugins.suggestions ? `<#${guildData.plugins.suggestions}>` : `*${interaction.translate("common:NOT_DEFINED")}*`
					}) + "\n" +
					interaction.translate("administration/config:REPORTS", {
						channel: guildData.plugins.reports ? `<#${guildData.plugins.reports}>` : `*${interaction.translate("common:NOT_DEFINED")}*`
					}) + "\n" +
					interaction.translate("administration/config:MODLOGS", {
						channel: guildData.plugins.modlogs ? `<#${guildData.plugins.modlogs}>` : `*${interaction.translate("common:NOT_DEFINED")}*`
					}) + "\n" +
					interaction.translate("administration/config:BIRTHDAYS", {
						channel: guildData.plugins.birthdays ? `<#${guildData.plugins.birthdays}>` : `*${interaction.translate("common:NOT_DEFINED")}*`
					})
				},
				{
					name: interaction.translate("administration/config:DASHBOARD_TITLE"),
					value: `[${interaction.translate("administration/config:DASHBOARD_CONTENT")}](${client.config.dashboard.baseURL})`
				}
			]);

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Config;