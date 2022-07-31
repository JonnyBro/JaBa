const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Configuration extends Command {
	constructor(client) {
		super(client, {
			name: "configuration",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["conf", "config"],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const guildData = data.guild;

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.guild.name,
				iconURL: message.guild.iconURL()
			})
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		embed.addFields([
			{ // Guild prefix
				name: message.translate("administration/configuration:PREFIX_TITLE"),
				value: guildData.prefix
			},
			{ // Ignored channels
				name: message.translate("administration/configuration:IGNORED_CHANNELS_TITLE"),
				value: guildData.ignoredChannels.length > 0 ? guildData.ignoredChannels.map((ch) => `<#${ch}>`).join(", ") : message.translate("administration/configuration:NO_IGNORED_CHANNELS")
			},
			{ // Autorole plugin
				name: message.translate("administration/configuration:AUTOROLE_TITLE"),
				value: guildData.plugins.autorole.enabled ? message.translate("administration/configuration:AUTOROLE_CONTENT", {
					roleName: `<@&${guildData.plugins.autorole.role}>`
				}) : message.translate("administration/configuration:AUTOROLE_DISABLED")
			},
			{ // Welcome plugin
				name: message.translate("administration/configuration:WELCOME_TITLE"),
				value: guildData.plugins.welcome.enabled ? message.translate("administration/configuration:WELCOME_CONTENT", {
					channel: `<#${guildData.plugins.welcome.channel}>`,
					withImage: guildData.plugins.welcome.withImage ? message.translate("common:YES") : message.translate("common:NO")
				}) : message.translate("administration/configuration:WELCOME_DISABLED")
			},
			{ // Goodbye plugin
				name: message.translate("administration/configuration:GOODBYE_TITLE"),
				value: guildData.plugins.goodbye.enabled ? message.translate("administration/configuration:GOODBYE_CONTENT", {
					channel: `<#${guildData.plugins.goodbye.channel}>`,
					withImage: guildData.plugins.goodbye.withImage ? message.translate("common:YES") : message.translate("common:NO")
				}) : message.translate("administration/configuration:GOODBYE_DISABLED")
			},
			{ // Special channels
				name: message.translate("administration/configuration:SPECIAL_CHANNELS"),
				value: message.translate("administration/configuration:SUGGESTIONS", {
					channel: guildData.plugins.suggestions ? `<#${guildData.plugins.suggestions}>` : message.translate("common:NOT_DEFINED")
				}) + "\n" +
				message.translate("administration/configuration:REPORTS", {
					channel: guildData.plugins.reports ? `<#${guildData.plugins.reports}>` : message.translate("common:NOT_DEFINED")
				}) + "\n" +
				message.translate("administration/configuration:MODLOGS", {
					channel: guildData.plugins.modlogs ? `<#${guildData.plugins.modlogs}>` : message.translate("common:NOT_DEFINED")
				}) + "\n" +
				message.translate("administration/configuration:BIRTHDAYS", {
					channel: guildData.plugins.birthdays ? `<#${guildData.plugins.birthdays}>` : message.translate("common:NOT_DEFINED")
				})
			},
			{ // Auto sanctions
				name: message.translate("administration/configuration:AUTO_SANCTIONS"),
				value: (guildData.plugins.warnsSanctions.kick ? message.translate("administration/configuration:KICK_CONTENT", {
					count: guildData.plugins.warnsSanctions.kick
				}) : message.translate("administration/configuration:KICK_NOT_DEFINED")) + "\n" + (guildData.plugins.warnsSanctions.ban ? message.translate("administration/configuration:BAN_CONTENT", {
					count: guildData.plugins.warnsSanctions.ban
				}) : message.translate("administration/configuration:BAN_NOT_DEFINED"))
			},
			{ // Automod plugin
				name: message.translate("administration/configuration:AUTOMOD_TITLE"),
				value: guildData.plugins.automod.enabled ? message.translate("administration/configuration:AUTOMOD_CONTENT", {
					channels: guildData.plugins.automod.ignored.map((ch) => `<#${ch}>`)
				}) : message.translate("administration/configuration:AUTOMOD_DISABLED")
			},
			{ // Auto-delete mod commands
				name: message.translate("administration/configuration:AUTODELETEMOD"),
				value: guildData.autoDeleteModCommands ? message.translate("administration/configuration:AUTODELETEMOD_ENABLED") : message.translate("administration/configuration:AUTODELETEMOD_DISABLED")
			},
			{ // Dashboard link
				name: message.translate("administration/configuration:DASHBOARD_TITLE"),
				value: `[${message.translate("administration/configuration:DASHBOARD_CONTENT")}](${data.config.dashboard.baseURL})`
			}
		]);

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Configuration;