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

type SettingOptions = {
	language: string | null;
	state: boolean | null;
	channel: Channel | null;
};

const client = useClient();

const localeChoises = client.i18n.SupportedLanguages.map(lng => ({
	name: languageMeta.find(l => l.locale === lng)!.name,
	value: lng,
}));

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

	const subcommand = interaction.options.getSubcommand();

	if (subcommand === "list") {
		const guildData = await client.getGuildData(interaction.guildId!);
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

	const options: SettingOptions = {
		language: interaction.options.getString("language"),
		state: interaction.options.getBoolean("state"),
		channel: interaction.options.getChannel("channel") as Channel,
	};

	const reply = await changeSetting(interaction, subcommand, options);

	await interaction.editReply({
		content: reply,
	});
};

async function generateReply(
	interaction: ChatInputCommandInteraction,
	subcommand: string,
	args: Record<string, unknown>,
) {
	const translatedParam = await translateContext(
		interaction,
		`administration/config:${subcommand.toUpperCase()}_REPLY`,
		args,
	);

	return translatedParam;
}

async function changeSetting(interaction: ChatInputCommandInteraction, subcommand: string, options: SettingOptions) {
	const guildData = await client.getGuildData(interaction.guildId!);

	switch (subcommand) {
		case "language": {
			const lang = client.i18n.SupportedLanguages.find(l => l === options.language)!;
			const langName = languageMeta.find(l => l.locale === lang)!.nativeName;

			guildData.set("language", lang);
			await guildData.save();

			return await generateReply(interaction, subcommand, {
				flag: `:flag_${lang.split("-")[1].toLowerCase()}:`,
				lang: langName,
			});
		}

		case "birthdays":
			if (!options.state || !options.channel) {
				guildData.set("plugins.birthdays", false);
				await guildData.save();

				return await generateReply(interaction, subcommand, {
					channel: await translateContext(interaction, "common:DISABLED"),
				});
			}

			guildData.set("plugins.birthdays", options.channel.id);
			await guildData.save();

			return await generateReply(interaction, subcommand, {
				channel: options.channel.toString(),
			});
		case "autoplay":
			if (!guildData.plugins.music) guildData.plugins.music = { autoPlay: false };

			guildData.set("plugins.music.autoPlay", options.state);
			await guildData.save();

			return await generateReply(interaction, subcommand, {
				state: options.state,
			});
	}
}
