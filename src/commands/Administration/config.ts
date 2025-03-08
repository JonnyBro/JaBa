import { getLocalizedDesc, replyError, translateContext } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, Channel, ChannelType, ChatInputCommandInteraction, InteractionContextType, MessageFlags, PermissionsBitField } from "discord.js";
import GuildModel from "@/models/GuildModel.js";
import { generateFields } from "@/utils/config-fields.js";

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
			fields,
		});

		return interaction.editReply({ embeds: [embed] });
	}

	const parameter = interaction.options.getString("parameter", true);
	const state = interaction.options.getBoolean("state", true);
	const channel = interaction.options.getChannel("channel") as Channel;

	await changeSetting(interaction, guildData, parameter, state, channel);
};

async function saveSettings(guildData: InstanceType<typeof GuildModel>, parameter: string, value: unknown) {
	guildData.plugins[parameter] = value;
	guildData.markModified(`plugins.${parameter}`);

	await guildData.save();
}

async function generateReply(interaction: ChatInputCommandInteraction, guildData: InstanceType<typeof GuildModel>, parameter: string, state: boolean, channel?: Channel | null) {
	const translatedParam = await translateContext(interaction, `administration/config:${parameter.toUpperCase()}`);
	const enabledText = await translateContext(interaction, "common:ENABLED");
	const disabledText = await translateContext(interaction, "common:DISABLED");

	if (channel) return `${translatedParam}: **${enabledText}** (${channel.toString()})`;

	return `${translatedParam}: ${state ? `**${enabledText}** (<#${guildData.plugins[parameter]}>)` : `**${disabledText}**`}`;
}

async function changeSetting(interaction: ChatInputCommandInteraction, guildData: any, parameter: string, state: boolean, channel?: Channel | null) {
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
