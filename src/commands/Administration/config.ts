import { getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import languageMeta from "@/services/languages/language-meta.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { generateFields } from "@/utils/config-fields.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	Channel,
	ChatInputCommandInteraction,
	InteractionContextType,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";

const client = useClient();

const localeChoises = client.i18n.SupportedLanguages.map(lng => {
	const name = languageMeta.find(l => l.locale === lng)!.name;

	return { name, value: lng };
});

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
			name: "language",
			...getLocalizedDesc("administration/config:LANG"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "language",
					...getLocalizedDesc("common:LANGUAGE"),
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: localeChoises,
				},
			],
		},
		{
			name: "birthdays",
			...getLocalizedDesc("administration/config:BIRTHDAYS"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
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
				},
			],
		},
		{
			name: "autoplay",
			...getLocalizedDesc("administration/config:AUTOPLAY"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "state",
					...getLocalizedDesc("common:STATE"),
					type: ApplicationCommandOptionType.Boolean,
					required: true,
				},
			],
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const guildData = await client.getGuildData(interaction.guildId!);
	const subcommand = interaction.options.getSubcommand();

	if (subcommand === "list") {
		const fields = await generateFields(interaction, guildData);
		const embed = createEmbed({
			author: {
				name: interaction.guild!.name,
				iconURL: interaction.guild!.iconURL() || "",
			},
			fields,
		});

		return interaction.editReply({ embeds: [embed] });
	}

	if (subcommand === "language") {
		const selectedLang = interaction.options.getString("language", true);
		const lang = client.i18n.SupportedLanguages.find(l => l === selectedLang)!;
		const langName = languageMeta.find(l => l.locale === lang)!.nativeName;

		guildData.set("language", lang);
		await guildData.save();

		const embed = createEmbed({
			author: {
				name: client.user.username,
				iconURL: client.user.avatarURL({ size: 1024 })!,
			},
			description: await translateContext(interaction, "administration/config:LANG_SUCCESS", {
				flag: `:flag_${lang.split("-")[1].toLowerCase()}:`,
				lang: langName,
			}),
		});

		return interaction.editReply({ embeds: [embed] });
	}

	const state = interaction.options.getBoolean("state", true);
	const channel = interaction.options.getChannel("channel") as Channel || null;

	if (channel) {
		const reply = await changeSetting(interaction, subcommand, state, channel);

		await interaction.editReply({
			content: reply,
		});
	}

	const reply = await changeSetting(interaction, subcommand, state);

	await interaction.editReply({
		content: reply,
	});
};

async function generateReply(
	interaction: ChatInputCommandInteraction,
	subcommand: string,
	state: boolean,
	channel?: Channel,
) {
	const translatedParam = await translateContext(
		interaction,
		`administration/config:${subcommand.toUpperCase()}`,
	);
	const enabledText = await translateContext(interaction, "common:ENABLED");
	const disabledText = await translateContext(interaction, "common:DISABLED");

	if (channel) return `${translatedParam}: **${enabledText}** (${channel.toString()})`;

	return `${translatedParam}: ${state ? `**${enabledText}**` : `**${disabledText}**`}`;
}

async function changeSetting(
	interaction: ChatInputCommandInteraction,
	subcommand: string,
	state: boolean,
	channel?: Channel,
) {
	const guildData = await client.getGuildData(interaction.guildId!);

	if (subcommand === "birthdays") {
		if (!channel) {
			guildData.set("plugins.birthdays", null);
			await guildData.save();

			return await generateReply(interaction, subcommand, state);
		}

		guildData.set("plugins.birthdays", channel.id);
		await guildData.save();

		return await generateReply(interaction, subcommand, state, channel);
	} else if (subcommand === "autoplay") {
		if (!guildData.plugins.music) guildData.plugins.music = { autoPlay: false };

		guildData.set("plugins.music.autoPlay", state);
		await guildData.save();

		return await generateReply(interaction, subcommand, state);
	}
}
