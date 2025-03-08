import { getLocalizedDesc, replyError, translateContext } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, ChannelType, ChatInputCommandInteraction, InteractionContextType, MessageFlags, PermissionsBitField } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "config",
	...getLocalizedDesc("administration/config:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	// eslint-disable-next-line camelcase
	default_member_permissions: String(PermissionsBitField.Flags.ManageGuild),
	options: [
		{
			name: "list",
			...getLocalizedDesc("administration/config:LIST"),
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "set",
			...getLocalizedDesc("administration/config:SET"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "parameter",
					...getLocalizedDesc("administration/config:PARAMETER"),
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
					name: "state",
					...getLocalizedDesc("common:STATE"),
					type: ApplicationCommandOptionType.Boolean,
					required: true,
				},
				{
					name: "channel",
					...getLocalizedDesc("common:CHANNEL"),
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
		const fields = await generateFields(interaction, guildData);
		const embed = createEmbed({
			author: {
				name: interaction.guild.name,
				iconURL: interaction.guild.iconURL() || "",
			},
			// TODO: тс даёт ошибку но работает ( я ещё учу тс ;( )
			// Тип "({ name: string; value: string; inline: boolean; } | undefined)[]" не может быть назначен для типа "readonly APIEmbedField[]".
			// @ts-ignore Type not assignable (for now)
			fields,
		});

		return interaction.editReply({ embeds: [embed] });
	}

	const parameter = interaction.options.getString("parameter", true);
	const state = interaction.options.getBoolean("state", true);
	const channel = interaction.options.getChannel("channel");

	await changeSetting(interaction, guildData, parameter, state, channel);
};

async function generateFields(interaction: ChatInputCommandInteraction, guildData: any) {
	const fieldsConfig = [
		{
			nameKey: "administration/config:WELCOME_TITLE",
			valueKey: "administration/config:WELCOME_CONTENT",
			plugin: guildData.plugins.welcome,
		},
		{
			nameKey: "administration/config:GOODBYE_TITLE",
			valueKey: "administration/config:GOODBYE_CONTENT",
			plugin: guildData.plugins.goodbye,
		},
		{
			nameKey: "administration/config:MONITORING_CHANNELS",
			values: [
				{ key: "administration/config:MESSAGEUPDATE", value: guildData.plugins?.monitoring?.messageUpdate },
				{ key: "administration/config:MESSAGEDELETE", value: guildData.plugins?.monitoring?.messageDelete },
			],
		},
		{
			nameKey: "administration/config:SPECIAL_CHANNELS",
			values: [
				{ key: "administration/config:BIRTHDAYS", value: guildData.plugins?.birthdays },
				{ key: "administration/config:MODLOGS", value: guildData.plugins?.modlogs },
				{ key: "administration/config:REPORTS", value: guildData.plugins?.reports },
				{ key: "administration/config:SUGGESTIONS", value: guildData.plugins?.suggestions },
				{ key: "administration/config:TICKETSCATEGORY", value: guildData.plugins?.tickets?.ticketsCategory },
				{ key: "administration/config:TICKETLOGS", value: guildData.plugins?.tickets?.ticketLogs },
				{ key: "administration/config:TRANSCRIPTIONLOGS", value: guildData.plugins?.tickets?.transcriptionLogs },
			],
		},
	];

	const fields = await Promise.all(
		fieldsConfig.map(async field => {
			const name = await translateContext(interaction, field.nameKey);

			if (field.plugin) {
				const value = field.plugin.enabled
					? await translateContext(interaction, field.valueKey!, {
						channel: `<#${field.plugin.channel}>`,
					})
					: await translateContext(interaction, "common:DISABLED");

				return { name, value, inline: true };
			}

			if (field.values) {
				const value = await Promise.all(
					field.values.map(async ({ key, value }) => {
						const translatedKey = await translateContext(interaction, key);
						const translatedValue = value ? `<#${value}>` : `*${await translateContext(interaction, "common:NOT_DEFINED")}*`;

						return `${translatedKey}: ${translatedValue}`;
					}),
				);

				return { name, value: value.join("\n"), inline: false };
			}
		}),
	);

	return fields;
}

async function saveSettings(guildData: any, parameter: string, value: any) { // TODO: Proper type for `any`
	guildData.plugins[parameter] = value;
	guildData.markModified(`plugins.${parameter}`);

	await guildData.save();
}

async function generateReply(interaction: ChatInputCommandInteraction, guildData: any, parameter: string, state: boolean, channel?: any) {
	const translatedParam = await translateContext(interaction, `administration/config:${parameter.toUpperCase()}`);
	const enabledText = await translateContext(interaction, "common:ENABLED");
	const disabledText = await translateContext(interaction, "common:DISABLED");

	if (channel) return `${translatedParam}: **${enabledText}** (${channel.toString()})`;

	return `${translatedParam}: ${state ? `**${enabledText}** (<#${guildData.plugins[parameter]}>)` : `**${disabledText}**`}`;
}

async function changeSetting(interaction: ChatInputCommandInteraction, guildData: any, parameter: string, state: boolean, channel?: any) {
	const parameterSplitted = parameter.split(".");
	const isNested = parameterSplitted.length === 2;

	if (isNested && guildData.plugins[parameterSplitted[0]] === undefined) {
		guildData.plugins[parameterSplitted[0]] = {};
	}

	if (!state) {
		await saveSettings(guildData, parameter, null);

		return interaction.editReply({
			content: await generateReply(interaction, guildData, parameterSplitted[isNested ? 1 : 0], state),
		});
	}

	if (isNested && parameterSplitted[1] === "ticketsCategory" && channel?.type !== ChannelType.GuildCategory) {
		return interaction.editReply({
			content: await translateContext(interaction, "administration/config:TICKETS_NOT_CATEGORY"),
		});
	}

	if (channel) {
		await saveSettings(guildData, parameter, channel.id);
	}

	return interaction.editReply({
		content: await generateReply(interaction, guildData, parameterSplitted[isNested ? 1 : 0], state, channel),
	});
}
