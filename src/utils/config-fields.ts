import { translateContext } from "@/helpers/extenders.js";
import { Guild } from "@/models/GuildModel.js";
import { APIEmbedField, ChatInputCommandInteraction } from "discord.js";

enum ConfigFieldsType {
	plugin = "plugin",
	group = "group",
}

type ConfigPluginField = {
	type: ConfigFieldsType.plugin;
	nameKey: string;
	valueKey: string;
	enabled: boolean;
	data: {
		channel: string;
	};
};

type ConfigGroupField = {
	type: ConfigFieldsType.group;
	nameKey: string;
	items: Array<{
		key: string;
		path: string;
		format: string;
	}>;
};

type ConfigField = ConfigPluginField | ConfigGroupField;

const processPluginField = async (
	interaction: ChatInputCommandInteraction,
	field: ConfigPluginField,
) => {
const processPluginField = async (
	interaction: ChatInputCommandInteraction,
	field: ConfigPluginField,
) => {
	const name = await translateContext(interaction, field.nameKey);

	const value = field.enabled
		? await translateContext(interaction, field.valueKey, {
			...field.data,
			channel: `<#${field.data.channel}>`,
		})
		: await translateContext(interaction, "common:DISABLED");
	return { name, value, inline: true };
};

const processGroupField = async (
	interaction: ChatInputCommandInteraction,
	field: ConfigGroupField,
) => {
const processGroupField = async (
	interaction: ChatInputCommandInteraction,
	field: ConfigGroupField,
) => {
	const name = await translateContext(interaction, field.nameKey);
	const lines = await Promise.all(
		field.items.map(async item => {
			const translatedKey = await translateContext(interaction, item.key);
			const rawValue = item.path;

			let formattedValue;
			switch (item.format) {
				case "channel":
					formattedValue = rawValue
						? `<#${rawValue}>`
						: `*${await translateContext(interaction, "common:NOT_DEFINED")}*`;
					formattedValue = rawValue
						? `<#${rawValue}>`
						: `*${await translateContext(interaction, "common:NOT_DEFINED")}*`;
					break;
				default:
					formattedValue = rawValue?.toString() || "N/A";
			}

			return `${translatedKey}: ${formattedValue}`;
		}),
	);

	return { name, value: lines.join("\n"), inline: false };
};

export const generateFields = async (
	interaction: ChatInputCommandInteraction,
	guildData: InstanceType<typeof Guild>,
) => {
	const fieldsConfig: ConfigField[] = [
		{
			type: ConfigFieldsType.plugin,
			nameKey: "administration/config:WELCOME_TITLE",
			valueKey: "administration/config:WELCOME_CONTENT",
			enabled: guildData.plugins.welcome.enabled,
			data: { channel: guildData.plugins.welcome.channel! },
		},
		{
			type: ConfigFieldsType.plugin,
			nameKey: "administration/config:GOODBYE_TITLE",
			valueKey: "administration/config:GOODBYE_CONTENT",
			enabled: guildData.plugins.goodbye.enabled,
			data: { channel: guildData.plugins.goodbye.channel! },
		},
		{
			type: ConfigFieldsType.group,
			nameKey: "administration/config:MONITORING_CHANNELS",
			items: [
				{
					key: "administration/config:MESSAGEUPDATE",
					path: guildData.plugins.monitoring.messageUpdate!,
					format: "channel",
				},
				{
					key: "administration/config:MESSAGEDELETE",
					path: guildData.plugins.monitoring.messageDelete!,
					format: "channel",
				},
			],
		},
		{
			type: ConfigFieldsType.group,
			nameKey: "administration/config:SPECIAL_CHANNELS",
			items: [
				{
					key: "administration/config:BIRTHDAYS",
					path: guildData.plugins.birthdays!,
					format: "channel",
				},
				{
					key: "administration/config:MODLOGS",
					path: guildData.plugins.modlogs!,
					format: "channel",
				},
				{
					key: "administration/config:REPORTS",
					path: guildData.plugins.reports!,
					format: "channel",
				},
				{
					key: "administration/config:SUGGESTIONS",
					path: guildData.plugins.suggestions!,
					format: "channel",
				},
				{
					key: "administration/config:TICKETSCATEGORY",
					path: guildData.plugins.tickets.ticketsCategory!,
					format: "channel",
				},
				{
					key: "administration/config:TICKETLOGS",
					path: guildData.plugins.tickets.ticketLogs!,
					format: "channel",
				},
				{
					key: "administration/config:TRANSCRIPTIONLOGS",
					path: guildData.plugins.tickets.transcriptionLogs!,
					format: "channel",
				},
			],
		},
	];

	const fields: readonly APIEmbedField[] = await Promise.all(
		fieldsConfig.map(async field => {
			switch (field.type) {
				case ConfigFieldsType.plugin:
					return processPluginField(interaction, field);
				case ConfigFieldsType.group:
					return processGroupField(interaction, field);
			}
		}),
	);
	return fields;
};
