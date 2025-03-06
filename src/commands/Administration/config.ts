import { replyError, translateContext } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, ChannelType, ChatInputCommandInteraction, InteractionContextType, MessageFlags, PermissionsBitField } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "config",
	description: client.i18n.translate("administration/config:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	description_localizations: {
		ru: client.i18n.translate("administration/config:DESCRIPTION", { lng: "ru-RU" }),
		uk: client.i18n.translate("administration/config:DESCRIPTION", { lng: "uk-UA" }),
	},
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	// eslint-disable-next-line camelcase
	default_member_permissions: String(PermissionsBitField.Flags.ManageGuild),
	options: [
		{
			name: "list",
			description: client.i18n.translate("administration/config:LIST"),
			// eslint-disable-next-line camelcase
			description_localizations: {
				ru: client.i18n.translate("administration/config:LIST", { lng: "ru-RU" }),
				uk: client.i18n.translate("administration/config:LIST", { lng: "uk-UA" }),
			},
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "set",
			description: client.i18n.translate("administration/config:SET"),
			// eslint-disable-next-line camelcase
			description_localizations: {
				ru: client.i18n.translate("administration/config:SET", { lng: "ru-RU" }),
				uk: client.i18n.translate("administration/config:SET", { lng: "uk-UA" }),
			},
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "parameter",
					description: client.i18n.translate("administration/config:PARAMETER"),
					// eslint-disable-next-line camelcase
					description_localizations: {
						ru: client.i18n.translate("administration/config:PARAMETER", { lng: "ru-RU" }),
						uk: client.i18n.translate("administration/config:PARAMETER", { lng: "uk-UA" }),
					},
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: [
						{ name: client.i18n.translate("administration/config:BIRTHDAYS"), value: "birthdays" },
						{ name: client.i18n.translate("administration/config:MODLOGS"), value: "modlogs" },
						{ name: client.i18n.translate("administration/config:REPORTS"), value: "reports" },
						{ name: client.i18n.translate("administration/config:SUGGESTIONS"), value: "suggestions" },
						{ name: client.i18n.translate("administration/config:TICKETSCATEGORY"), value: "tickets.ticketsCategory" },
						{ name: client.i18n.translate("administration/config:TICKETLOGS"), value: "tickets.ticketLogs" },
						{ name: client.i18n.translate("administration/config:TRANSCRIPTIONLOGS"), value: "tickets.transcriptionLogs" },
						{ name: client.i18n.translate("administration/config:MESSAGEUPDATE"), value: "monitoring.messageUpdate" },
						{ name: client.i18n.translate("administration/config:MESSAGEDELETE"), value: "monitoring.messageDelete" },
					],
				},
				{
					name: "boolean",
					description: client.i18n.translate("common:STATE"),
					// eslint-disable-next-line camelcase
					description_localizations: {
						ru: client.i18n.translate("common:STATE", { lng: "ru-RU" }),
						uk: client.i18n.translate("common:STATE", { lng: "uk-UA" }),
					},
					type: ApplicationCommandOptionType.Boolean,
					required: true,
				},
				{
					name: "channel",
					description: client.i18n.translate("common:CHANNEL"),
					// eslint-disable-next-line camelcase
					description_localizations: {
						ru: client.i18n.translate("common:CHANNEL", { lng: "ru-RU" }),
						uk: client.i18n.translate("common:CHANNEL", { lng: "uk-UA" }),
					},
					type: ApplicationCommandOptionType.Channel,
					required: false,
				},
			],
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	if (!interaction.guild) return replyError(interaction, "misc:GUILD_ONLY", null, { edit: true });

	const guildData = await client.getGuildData(interaction.guild.id);
	const command = interaction.options.getSubcommand();

	if (command === "list") {
		const embed = createEmbed({
			author: {
				name: interaction.guild.name,
				iconURL: interaction.guild.iconURL() || "",
			},
			fields: [
				{
					name: await translateContext(interaction, "administration/config:WELCOME_TITLE"),
					value: guildData.plugins.welcome.enabled
						? await translateContext(interaction, "administration/config:WELCOME_CONTENT", {
							channel: `<#${guildData.plugins.welcome.channel}>`,
							withImage: guildData.plugins.welcome.withImage ? await translateContext(interaction, "common:YES") : await translateContext(interaction, "common:NO"),
						})
						: await translateContext(interaction, "common:DISABLED"),
					inline: true,
				},
				{
					name: await translateContext(interaction, "administration/config:GOODBYE_TITLE"),
					value: guildData.plugins.goodbye.enabled
						? await translateContext(interaction, "administration/config:GOODBYE_CONTENT", {
							channel: `<#${guildData.plugins.goodbye.channel}>`,
							withImage: guildData.plugins.goodbye.withImage ? await translateContext(interaction, "common:YES") : await translateContext(interaction, "common:NO"),
						})
						: await translateContext(interaction, "common:DISABLED"),
					inline: true,
				},
				{
					name: await translateContext(interaction, "administration/config:MONITORING_CHANNELS"),
					value:
						`${await translateContext(interaction, "administration/config:MESSAGEUPDATE")}: ${guildData.plugins?.monitoring?.messageUpdate ? `<#${guildData.plugins?.monitoring?.messageUpdate}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`}\n` +
						`${await translateContext(interaction, "administration/config:MESSAGEDELETE")}: ${guildData.plugins?.monitoring?.messageDelete ? `<#${guildData.plugins?.monitoring?.messageDelete}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`}\n`,
				},
				{
					name: await translateContext(interaction, "administration/config:SPECIAL_CHANNELS"),
					value:
						`${await translateContext(interaction, "administration/config:BIRTHDAYS")}: ${guildData.plugins?.birthdays ? `<#${guildData.plugins.birthdays}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`}\n` +
						`${await translateContext(interaction, "administration/config:MODLOGS")}: ${guildData.plugins?.modlogs ? `<#${guildData.plugins.modlogs}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`}\n` +
						`${await translateContext(interaction, "administration/config:REPORTS")}: ${guildData.plugins?.reports ? `<#${guildData.plugins.reports}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`}\n` +
						`${await translateContext(interaction, "administration/config:SUGGESTIONS")}: ${guildData.plugins?.suggestions ? `<#${guildData.plugins.suggestions}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`}\n` +
						`${await translateContext(interaction, "administration/config:TICKETSCATEGORY")}: ${guildData.plugins?.tickets?.ticketsCategory ? `<#${guildData.plugins?.tickets?.ticketsCategory}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`}\n` +
						`${await translateContext(interaction, "administration/config:TICKETLOGS")}: ${guildData.plugins?.tickets?.ticketLogs ? `<#${guildData.plugins?.tickets?.ticketLogs}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`}\n` +
						`${await translateContext(interaction, "administration/config:TRANSCRIPTIONLOGS")}: ${guildData.plugins?.tickets?.transcriptionLogs ? `<#${guildData.plugins?.tickets?.transcriptionLogs}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`}\n`,
				},
			],
		});

		return interaction.editReply({
			embeds: [embed],
		});
	} else {
		const parameter = interaction.options.getString("parameter", true),
			state = interaction.options.getBoolean("state", true),
			channel = interaction.options.getChannel("channel");

		await changeSetting(interaction, guildData, parameter, state, channel);
	}
};

async function changeSetting(interaction: ChatInputCommandInteraction, data: any, parameter: string, state: boolean, channel: any) { // TODO: Proper type for channel
	const parameterSplitted = parameter.split(".");

	if (parameterSplitted.length === 2) {
		if (data.plugins[parameterSplitted[0]] === undefined) data.plugins[parameterSplitted[0]] = {};

		if (!state) {
			data.plugins[parameterSplitted[0]][parameterSplitted[1]] = null;

			data.markModified(`plugins.${parameter}`);
			await data.save();

			return interaction.reply({
				content: `${await translateContext(interaction, `administration/config:${parameterSplitted.length === 2 ? parameterSplitted[1].toUpperCase() : parameter.toUpperCase()}`)}: **${await translateContext(interaction, "common:DISABLED")}**`,
				ephemeral: true,
			});
		} else {
			if (parameterSplitted[1] === "ticketsCategory" && channel?.type !== ChannelType.GuildCategory) return interaction.reply({ content: await translateContext(interaction, "administration/config:TICKETS_NOT_CATEGORY"), ephemeral: true });

			if (channel) {
				data.plugins[parameterSplitted[0]][parameterSplitted[1]] = channel.id;

				data.markModified(`plugins.${parameter}`);
				await data.save();

				return interaction.reply({
					content: `${await translateContext(interaction, `administration/config:${parameterSplitted.length === 2 ? parameterSplitted[1].toUpperCase() : parameter.toUpperCase()}`)}: **${await translateContext(interaction, "common:ENABLED")}** (${channel.toString()})`,
					ephemeral: true,
				});
			} else {
				return interaction.reply({
					content: `${await translateContext(interaction, `administration/config:${parameterSplitted.length === 2 ? parameterSplitted[1].toUpperCase() : parameter.toUpperCase()}`)}: ${
						data.plugins[parameter] ? `**${await translateContext(interaction, "common:ENABLED")}** (<#${data.plugins[parameter]}>)` : `**${await translateContext(interaction, "common:DISABLED")}**`
					}`,
					ephemeral: true,
				});
			}
		};
	} else {
		if (!state) {
			data.plugins[parameter] = null;

			data.markModified(`plugins.${parameter}`);
			await data.save();

			return interaction.reply({
				content: `${client.i18n.translate(`administration/config:${parameter.toUpperCase()}`)}: **${client.i18n.translate("common:DISABLED")}**`,
				ephemeral: true,
			});
		} else {
			if (channel) {
				data.plugins[parameter] = channel.id;

				data.markModified(`plugins.${parameter}`);
				await data.save();

				return interaction.reply({
					content: `${client.i18n.translate(`administration/config:${parameter.toUpperCase()}`)}: **${client.i18n.translate("common:ENABLED")}** (${channel.toString()})`,
					ephemeral: true,
				});
			} else {
				return interaction.reply({
					content: `${client.i18n.translate(`administration/config:${parameter.toUpperCase()}`)}: ${
						data.plugins[parameter] ? `**${client.i18n.translate("common:ENABLED")}** (<#${data.plugins[parameter]}>)` : `**${client.i18n.translate("common:DISABLED")}**`
					}`,
					ephemeral: true,
				});
			}
		}
	}
}
