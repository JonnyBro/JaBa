import { translateContext } from "@/helpers/functions.js";
import GuildModel from "@/models/GuildModel.js";
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
	data: any;
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

const processPluginField = async (interaction: ChatInputCommandInteraction, field: ConfigPluginField) => {
	const name = await translateContext(interaction, field.nameKey);

	const value = field.enabled
		? await translateContext(interaction, field.valueKey, {
			...field.data,
			channel: `<#${field.data.channel}>`,
		})
		: await translateContext(interaction, "common:DISABLED");
	return { name, value, inline: true };
};

const processGroupField = async (interaction: ChatInputCommandInteraction, field: ConfigGroupField) => {
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
	guildData: InstanceType<typeof GuildModel>,
) => {
	const fieldsConfig: ConfigField[] = [
		{
			type: ConfigFieldsType.plugin,
			nameKey: "administration/config:AUTOPLAY",
			valueKey: "common:ENABLED",
			enabled: guildData.plugins.music.autoPlay,
			data: { channel: "" },
		},
		{
			type: ConfigFieldsType.group,
			nameKey: "administration/config:SPECIAL_CHANNELS",
			items: [
				{
					key: "administration/config:BIRTHDAYS",
					path: guildData.plugins.birthdays ? guildData.plugins.birthdays : "",
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
