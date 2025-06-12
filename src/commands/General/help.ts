import { editReplyError, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	StringSelectMenuBuilder,
} from "discord.js";

const client = useClient();

const HELP_SELECT_ID = "help_category_select";

export const data: CommandData = {
	name: "help",
	...getLocalizedDesc("general/help:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [
		InteractionContextType.BotDM,
		InteractionContextType.Guild,
		InteractionContextType.PrivateChannel,
	],
	options: [
		{
			name: "command",
			...getLocalizedDesc("common:COMMAND"),
			type: ApplicationCommandOptionType.String,
			autocomplete: true,
		},
		{
			name: "ephemeral",
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
			type: ApplicationCommandOptionType.Boolean,
		},
	],
};

function getCategoryFromPath(filepath: string): string {
	const segments = filepath.split(/[\\/]/);
	const commandsIndex = segments.lastIndexOf("commands");
	return segments[commandsIndex + 1] || "uncategorized";
}

// TODO: Rewrite to components v2
export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const inputCommand = interaction.options.getString("command");
	const commandEntries = client.commands;

	if (inputCommand) {
		const cmd = commandEntries.find(c => c.data.name === inputCommand);
		if (!cmd) {
			return editReplyError(interaction, "general/help:NOT_FOUND", {
				command: inputCommand,
			});
		}

		const category = getCategoryFromPath(cmd.filePath);

		const embed = createEmbed({
			author: {
				name: await translateContext(interaction, "general/help:CMD_TITLE", {
					cmd: cmd.data.name,
				}),
			},
			fields: [
				{
					name: await translateContext(interaction, "general/help:FIELD_DESCRIPTION"),
					value: await translateContext(
						interaction,
						`${category}/${cmd.data.name}:DESCRIPTION`,
					),
				},
				{
					name: await translateContext(interaction, "general/help:FIELD_USAGE"),
					value:
						(await translateContext(
							interaction,
							`${category}/${cmd.data.name}:USAGE`,
						)) || (await translateContext(interaction, "misc:NO_ARGS")),
				},
				{
					name: await translateContext(interaction, "general/help:FIELD_EXAMPLES"),
					value: await translateContext(
						interaction,
						`${category}/${cmd.data.name}:EXAMPLES`,
					),
				},
			],
		});

		return interaction.editReply({ embeds: [embed] });
	}

	// Grouping commands
	const grouped = new Map<string, typeof commandEntries>();
	for (const cmd of commandEntries) {
		const category = getCategoryFromPath(cmd.filePath);
		if (!grouped.has(category)) grouped.set(category, []);
		grouped.get(category)!.push(cmd);
	}

	const select = new StringSelectMenuBuilder()
		.setCustomId(HELP_SELECT_ID)
		.setPlaceholder(await translateContext(interaction, "common:NOTHING_SELECTED"))
		.addOptions(
			Array.from(grouped.entries()).map(([category, cmds]) => ({
				label: `${category} (${cmds.length})`,
				value: category,
			})),
		);

	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

	await interaction.editReply({
		content: await translateContext(interaction, "general/help:INFO"),
		components: [row],
	});
};

export const autocompleteRun = async ({ interaction }: AutocompleteProps) => {
	const query = interaction.options.getFocused();
	const commandEntries = client.commands as Array<{ data: CommandData }>;

	const results = commandEntries
		.filter(cmd => cmd.data.name.includes(query))
		.slice(0, 25)
		.map(cmd => ({
			name: cmd.data.name,
			value: cmd.data.name,
		}));

	await interaction.respond(results);
};

// Handle help select menu
client.on("interactionCreate", async interaction => {
	if (!interaction.isStringSelectMenu()) return;
	if (interaction.customId !== HELP_SELECT_ID) return;

	await interaction.deferUpdate();

	const category = interaction.values[0];
	const commandEntries = client.commands;

	const filtered = commandEntries.filter(cmd => getCategoryFromPath(cmd.filePath) === category);

	const embed = createEmbed({
		author: {
			name: await translateContext(interaction, "general/help:COMMANDS_IN", { category }),
		},
		fields: await Promise.all(
			filtered.map(async cmd => ({
				name: `**${cmd.data.name}**`,
				value: await translateContext(
					interaction,
					await translateContext(
						interaction,
						`${category.toLowerCase()}/${cmd.data.name.toLowerCase()}:DESCRIPTION`,
					),
				),
			})),
		),
	});

	await interaction.editReply({
		embeds: [embed],
	});
});
