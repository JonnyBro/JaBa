import { getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import languageMeta from "@/services/languages/language-meta.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import {
	addTextWithThumbnail,
	createContainer,
	createFooter,
	createSeparator,
	createText,
} from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ChannelSelectMenuBuilder,
	ChannelType,
	Interaction,
	InteractionContextType,
	MessageFlags,
	PermissionsBitField,
	StringSelectMenuBuilder,
} from "discord.js";

const client = useClient();
const CONFIG_PANEL_ID = "GUILD_CONFIG";

export const data: CommandData = {
	name: "config",
	...getLocalizedDesc("administration/config:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	// eslint-disable-next-line camelcase
	default_member_permissions: String(PermissionsBitField.Flags.ManageGuild),
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	await interaction.editReply(await buildConfigPanel(interaction));
};

const flagEmoji = (locale: string) =>
	String.fromCodePoint(...[...locale.split("-")[1].toUpperCase()].map(c => 0x1f1a5 + c.charCodeAt(0)));

async function buildConfigPanel(interaction: Interaction) {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const guild = interaction.guild!;
	const guildData = await client.getGuildData(guild.id);

	const lang = languageMeta.find(l => l.locale === guildData.language);
	// Mongoose casts the "disabled" default (false) to the string "false"
	const birthdays = /^\d+$/.test(String(guildData.plugins.birthdays)) ? String(guildData.plugins.birthdays) : null;

	const languageSelect = new StringSelectMenuBuilder()
		.setCustomId(`${CONFIG_PANEL_ID}:language`)
		.setPlaceholder(await t("administration/config:LANGUAGE_PLACEHOLDER"))
		.addOptions(
			client.i18n.SupportedLanguages.map(locale => {
				const meta = languageMeta.find(l => l.locale === locale)!;

				return {
					label: meta.nativeName,
					description: meta.name,
					value: locale,
					emoji: flagEmoji(locale),
					default: locale === guildData.language,
				};
			}),
		);

	const birthdaysSelect = new ChannelSelectMenuBuilder()
		.setCustomId(`${CONFIG_PANEL_ID}:birthdays`)
		.setPlaceholder(await t("administration/config:BIRTHDAYS_PLACEHOLDER"))
		.setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
		.setMinValues(0)
		.setMaxValues(1);

	if (birthdays) birthdaysSelect.setDefaultChannels(birthdays);

	const container = createContainer();

	addTextWithThumbnail(
		container,
		`## ${guild.name}\n-# ${await t("administration/config:SETTINGS")}`,
		guild.iconURL({ size: 256 }),
	);

	container
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(
				`**${await t("administration/config:LANGUAGE")}**\n${
					lang ? `${flagEmoji(lang.locale)} ${lang.nativeName}` : guildData.language
				}`,
			),
		)
		.addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(languageSelect))
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(
				`**${await t("administration/config:BIRTHDAYS")}**\n${
					birthdays ? `<#${birthdays}>` : `*${await t("common:DISABLED")}*`
				}`,
			),
		)
		.addActionRowComponents(new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(birthdaysSelect))
		.addTextDisplayComponents(createFooter());

	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [container],
	};
}

componentRouter.register(CONFIG_PANEL_ID, async interaction => {
	if (!interaction.isStringSelectMenu() && !interaction.isChannelSelectMenu()) return;

	if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)) {
		await interaction.reply({
			content: await translateContext(interaction, "misc:CANT_YOU"),
			flags: MessageFlags.Ephemeral,
		});

		return;
	}

	const guildData = await client.getGuildData(interaction.guildId!);
	const setting = interaction.customId.split(":")[1];

	if (setting === "language" && interaction.isStringSelectMenu()) guildData.set("language", interaction.values[0]);
	if (setting === "birthdays" && interaction.isChannelSelectMenu())
		guildData.set("plugins.birthdays", interaction.values[0] || false);

	await guildData.save();

	await interaction.update(await buildConfigPanel(interaction));
});
