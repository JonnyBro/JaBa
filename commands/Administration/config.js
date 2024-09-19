const { SlashCommandBuilder, PermissionsBitField, ChannelType, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Config extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("config")
				.setDescription(client.translate("administration/config:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("administration/config:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("administration/config:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addSubcommand(subcommand =>
					subcommand
						.setName("list")
						.setDescription(client.translate("administration/config:LIST"))
						.setDescriptionLocalizations({
							uk: client.translate("administration/config:LIST", null, "uk-UA"),
							ru: client.translate("administration/config:LIST", null, "ru-RU"),
						}),
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName("set")
						.setDescription(client.translate("administration/config:SET"))
						.setDescriptionLocalizations({
							uk: client.translate("administration/config:SET", null, "uk-UA"),
							ru: client.translate("administration/config:SET", null, "ru-RU"),
						})
						.addStringOption(option =>
							option
								.setName("setting")
								.setDescription(client.translate("administration/config:SETTING"))
								.setDescriptionLocalizations({
									uk: client.translate("administration/config:SETTING", null, "uk-UA"),
									ru: client.translate("administration/config:SETTING", null, "ru-RU"),
								})
								.setChoices(
									{ name: client.translate("administration/config:BIRTHDAYS"), value: "birthdays" },
									{ name: client.translate("administration/config:MODLOGS"), value: "modlogs" },
									{ name: client.translate("administration/config:REPORTS"), value: "reports" },
									{ name: client.translate("administration/config:SUGGESTIONS"), value: "suggestions" },
									{ name: client.translate("administration/config:TICKETSCATEGORY"), value: "tickets.ticketsCategory" },
									{ name: client.translate("administration/config:TICKETLOGS"), value: "tickets.ticketLogs" },
									{ name: client.translate("administration/config:TRANSCRIPTIONLOGS"), value: "tickets.transcriptionLogs" },
									{ name: client.translate("administration/config:MESSAGEUPDATE"), value: "monitoring.messageUpdate" },
									{ name: client.translate("administration/config:MESSAGEDELETE"), value: "monitoring.messageDelete" },
								)
								.setRequired(true),
						)
						.addBooleanOption(option =>
							option
								.setName("state")
								.setDescription(client.translate("common:STATE"))
								.setDescriptionLocalizations({
									uk: client.translate("common:STATE", null, "uk-UA"),
									ru: client.translate("common:STATE", null, "ru-RU"),
								})
								.setRequired(true),
						)
						.addChannelOption(option =>
							option
								.setName("channel")
								.setDescription(client.translate("common:CHANNEL"))
								.setDescriptionLocalizations({
									uk: client.translate("common:CHANNEL", null, "uk-UA"),
									ru: client.translate("common:CHANNEL", null, "ru-RU"),
								}),
						),
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
		const guildData = interaction.data.guild,
			command = interaction.options.getSubcommand();

		if (command === "list") {
			const embed = client.embed({
				author: {
					name: interaction.guild.name,
					iconURL: interaction.guild.iconURL(),
				},
				fields: [
					{
						name: interaction.translate("administration/config:WELCOME_TITLE"),
						value: guildData.plugins.welcome.enabled
							? interaction.translate("administration/config:WELCOME_CONTENT", {
								channel: `<#${guildData.plugins.welcome.channel}>`,
								withImage: guildData.plugins.welcome.withImage ? interaction.translate("common:YES") : interaction.translate("common:NO"),
							}) : interaction.translate("common:DISABLED"),
						inline: true,
					},
					{
						name: interaction.translate("administration/config:GOODBYE_TITLE"),
						value: guildData.plugins.goodbye.enabled
							? interaction.translate("administration/config:GOODBYE_CONTENT", {
								channel: `<#${guildData.plugins.goodbye.channel}>`,
								withImage: guildData.plugins.goodbye.withImage ? interaction.translate("common:YES") : interaction.translate("common:NO"),
							}) : interaction.translate("common:DISABLED"),
						inline: true,
					},
					{
						name: interaction.translate("administration/config:AUTOROLE_TITLE"),
						value: guildData.plugins.autorole.enabled ? `<@&${guildData.plugins.autorole.role}>` : interaction.translate("common:DISABLED"),
					},
					{
						name: interaction.translate("administration/config:AUTO_SANCTIONS"),
						value:
							(guildData.plugins.warnsSanctions.kick
								? interaction.translate("administration/config:KICK_CONTENT", {
									count: guildData.plugins.warnsSanctions.kick,
								}) : interaction.translate("administration/config:KICK_NOT_DEFINED")) +
							"\n" +
							(guildData.plugins.warnsSanctions.ban
								? interaction.translate("administration/config:BAN_CONTENT", {
									count: guildData.plugins.warnsSanctions.ban,
								}) : interaction.translate("administration/config:BAN_NOT_DEFINED")),
					},
					{
						name: interaction.translate("administration/config:AUTOMOD_TITLE"),
						value: guildData.plugins.automod.enabled
							? interaction.translate("administration/config:AUTOMOD_CONTENT", {
								channels: guildData.plugins.automod.ignored.map(ch => ` ${ch}`),
							}) : interaction.translate("common:DISABLED"),
					},
					{
						name: interaction.translate("administration/config:MONITORING_CHANNELS"),
						value:
							`${interaction.translate("administration/config:MESSAGEUPDATE")}: ${guildData.plugins?.monitoring?.messageUpdate ? `<#${guildData.plugins?.monitoring?.messageUpdate}>` : `*${interaction.translate("common:NOT_DEFINED")}*`}\n` +
							`${interaction.translate("administration/config:MESSAGEDELETE")}: ${guildData.plugins?.monitoring?.messageDelete ? `<#${guildData.plugins?.monitoring?.messageDelete}>` : `*${interaction.translate("common:NOT_DEFINED")}*`}\n`,
					},
					{
						name: interaction.translate("administration/config:SPECIAL_CHANNELS"),
						value:
							`${interaction.translate("administration/config:BIRTHDAYS")}: ${guildData.plugins?.birthdays ? `<#${guildData.plugins.birthdays}>` : `*${interaction.translate("common:NOT_DEFINED")}*`}\n` +
							`${interaction.translate("administration/config:MODLOGS")}: ${guildData.plugins?.modlogs ? `<#${guildData.plugins.modlogs}>` : `*${interaction.translate("common:NOT_DEFINED")}*`}\n` +
							`${interaction.translate("administration/config:REPORTS")}: ${guildData.plugins?.reports ? `<#${guildData.plugins.reports}>` : `*${interaction.translate("common:NOT_DEFINED")}*`}\n` +
							`${interaction.translate("administration/config:SUGGESTIONS")}: ${guildData.plugins?.suggestions ? `<#${guildData.plugins.suggestions}>` : `*${interaction.translate("common:NOT_DEFINED")}*`}\n` +
							`${interaction.translate("administration/config:TICKETSCATEGORY")}: ${guildData.plugins?.tickets?.ticketsCategory ? `<#${guildData.plugins?.tickets?.ticketsCategory}>` : `*${interaction.translate("common:NOT_DEFINED")}*`}\n` +
							`${interaction.translate("administration/config:TICKETLOGS")}: ${guildData.plugins?.tickets?.ticketLogs ? `<#${guildData.plugins?.tickets?.ticketLogs}>` : `*${interaction.translate("common:NOT_DEFINED")}*`}\n` +
							`${interaction.translate("administration/config:TRANSCRIPTIONLOGS")}: ${guildData.plugins?.tickets?.transcriptionLogs ? `<#${guildData.plugins?.tickets?.transcriptionLogs}>` : `*${interaction.translate("common:NOT_DEFINED")}*`}\n`,
					},
					{
						name: interaction.translate("administration/config:DASHBOARD_TITLE"),
						value: `[${interaction.translate("administration/config:DASHBOARD_CONTENT")}](${client.config.dashboard.domain})`,
					},
				],
			});

			interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		} else {
			const setting = interaction.options.getString("setting"),
				state = interaction.options.getBoolean("state"),
				channel = interaction.options.getChannel("channel");

			await changeSetting(interaction, setting, state, channel);
		}
	}
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {String} setting
 * @param {Boolean} state
 * @param {import("discord.js").GuildTextBasedChannel | import("discord.js").CategoryChannel} channel
 * @returns
 */
async function changeSetting(interaction, setting, state, channel) {
	const settingSplitted = setting.split("."),
		data = interaction.data.guild;

	if (settingSplitted.length === 2) {
		if (data.plugins[settingSplitted[0]] === undefined) data.plugins[settingSplitted[0]] = {};

		if (!state) {
			data.plugins[settingSplitted[0]][settingSplitted[1]] = null;

			data.markModified(`plugins.${setting}`);
			await data.save();

			return interaction.reply({
				content: `${interaction.translate(`administration/config:${settingSplitted.length === 2 ? settingSplitted[1].toUpperCase() : setting.toUpperCase()}`)}: **${interaction.translate("common:DISABLED")}**`,
				ephemeral: true,
			});
		} else {
			if (settingSplitted[1] === "ticketsCategory" && channel.type !== ChannelType.GuildCategory) return interaction.reply({ content: interaction.translate("administration/config:TICKETS_NOT_CATEGORY"), ephemeral: true });

			if (channel) {
				data.plugins[settingSplitted[0]][settingSplitted[1]] = channel.id;

				data.markModified(`plugins.${setting}`);
				await data.save();

				return interaction.reply({
					content: `${interaction.translate(`administration/config:${settingSplitted.length === 2 ? settingSplitted[1].toUpperCase() : setting.toUpperCase()}`)}: **${interaction.translate("common:ENABLED")}** (${channel.toString()})`,
					ephemeral: true,
				});
			} else
				return interaction.reply({
					content: `${interaction.translate(`administration/config:${settingSplitted.length === 2 ? settingSplitted[1].toUpperCase() : setting.toUpperCase()}`)}: ${
						data.plugins[setting] ? `**${interaction.translate("common:ENABLED")}** (<#${data.plugins[setting]}>)` : `**${interaction.translate("common:DISABLED")}**`
					}`,
					ephemeral: true,
				});
		}
	} else {
		if (!state) {
			data.plugins[setting] = null;

			data.markModified(`plugins.${setting}`);
			await data.save();

			return interaction.reply({
				content: `${interaction.translate(`administration/config:${setting.toUpperCase()}`)}: **${interaction.translate("common:DISABLED")}**`,
				ephemeral: true,
			});
		} else {
			if (channel) {
				data.plugins[setting] = channel.id;

				data.markModified(`plugins.${setting}`);
				await data.save();

				return interaction.reply({
					content: `${interaction.translate(`administration/config:${setting.toUpperCase()}`)}: **${interaction.translate("common:ENABLED")}** (${channel.toString()})`,
					ephemeral: true,
				});
			} else
				return interaction.reply({
					content: `${interaction.translate(`administration/config:${setting.toUpperCase()}`)}: ${
						data.plugins[setting] ? `**${interaction.translate("common:ENABLED")}** (<#${data.plugins[setting]}>)` : `**${interaction.translate("common:DISABLED")}**`
					}`,
					ephemeral: true,
				});
		}
	}
}

module.exports = Config;
