import { capitalizeString, editReplyError, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	Interaction,
	InteractionContextType,
	MessageFlags,
	PermissionsBitField,
	StringSelectMenuBuilder,
} from "discord.js";

const client = useClient();

const HELP_SELECT_ID = "HELP_CATEGORY_SELECT";

export const data: CommandData = {
	name: "help",
	...getLocalizedDesc("general/help:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
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
	return segments[commandsIndex + 1].toLowerCase() || "uncategorized";
}

const groupByCategory = () => {
	const grouped = new Map<string, typeof client.commands>();

	for (const cmd of client.commands) {
		const category = getCategoryFromPath(cmd.filePath);
		if (!grouped.has(category)) grouped.set(category, []);
		grouped.get(category)!.push(cmd);
	}

	return grouped;
};

const toV2 = (container: ReturnType<typeof createContainer>) => ({
	flags: MessageFlags.IsComponentsV2 as const,
	components: [container],
});

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const inputCommand = interaction.options.getString("command");

	if (inputCommand) {
		const cmd = client.commands.find(c => c.data.name === inputCommand);
		if (!cmd) return editReplyError(interaction, "general/help:NOT_FOUND", { command: inputCommand });

		return interaction.editReply(await buildCommandHelp(interaction, cmd));
	}

	await interaction.editReply(await buildCategoryPanel(interaction));
};

async function buildCategoryPanel(interaction: Interaction, selected?: string) {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const grouped = groupByCategory();

	const container = createContainer().addTextDisplayComponents(
		createText(`## ${await t("general/help:TITLE", { name: client.user.username })}`),
	);

	const commands = selected ? grouped.get(selected) : undefined;

	if (selected && commands) {
		const lines = await Promise.all(
			commands.map(
				async cmd =>
					`**/${cmd.data.name}** - ${await t(`${selected}/${cmd.data.name.toLowerCase()}:DESCRIPTION`)}`,
			),
		);

		container
			.addTextDisplayComponents(
				createText(`-# ${await t("general/help:COMMANDS_IN", { category: capitalizeString(selected) })}`),
			)
			.addSeparatorComponents(createSeparator())
			.addTextDisplayComponents(createText(lines.join("\n")));
	} else {
		const lines = Array.from(grouped.entries()).map(
			([category, cmds]) => `**${capitalizeString(category)}** - \`${cmds.length}\``,
		);

		container.addSeparatorComponents(createSeparator()).addTextDisplayComponents(createText(lines.join("\n")));
	}

	const select = new StringSelectMenuBuilder()
		.setCustomId(HELP_SELECT_ID)
		.setPlaceholder(await t("common:NOTHING_SELECTED"))
		.addOptions(
			Array.from(grouped.entries()).map(([category, cmds]) => ({
				label: `${capitalizeString(category)} (${cmds.length})`,
				value: category,
				default: category === selected,
			})),
		);

	container
		.addSeparatorComponents(createSeparator())
		.addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select))
		.addTextDisplayComponents(createFooter(await t("general/help:INFO")));

	return toV2(container);
}

async function buildCommandHelp(interaction: Interaction, cmd: (typeof client.commands)[number]) {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const category = getCategoryFromPath(cmd.filePath);
	const name = cmd.data.name;

	const guildOnly = !!cmd.data.contexts && cmd.data.contexts.every(c => c === InteractionContextType.Guild);
	const toCodeLines = (text: string, prefix: string) =>
		text
			.split("\n")
			.filter(Boolean)
			.map(line => `\`${prefix}${line}\``)
			.join("\n");

	const usage = toCodeLines(await t(`${category}/${name}:USAGE`), `/${name} `);
	const examples = toCodeLines(await t(`${category}/${name}:EXAMPLES`), "/");

	const permissions = cmd.data.default_member_permissions
		? new PermissionsBitField(BigInt(cmd.data.default_member_permissions)).toArray()
		: [];
	const context = await t(guildOnly ? "general/help:GUILD_ONLY" : "general/help:NOT_GUILD_ONLY");

	const container = createContainer()
		.addTextDisplayComponents(
			createText(
				[
					`## /${name}`,
					`-# ${capitalizeString(category)} • ${context}`,
					await t(`${category}/${name}:DESCRIPTION`),
				].join("\n"),
			),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(
				[
					`**${await t("general/help:FIELD_USAGE")}**`,
					usage || (await t("misc:NO_ARGS")),
					"",
					`**${await t("general/help:FIELD_EXAMPLES")}**`,
					examples || `\`/${name}\``,
					"",
					`**${await t("general/help:FIELD_PERMISSIONS")}**`,
					permissions.map(p => `\`${p}\``).join(", ") || (await t("general/help:NO_REQUIRED_PERMISSION")),
				].join("\n"),
			),
		)
		.addTextDisplayComponents(createFooter());

	return toV2(container);
}

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

componentRouter.register(HELP_SELECT_ID, async interaction => {
	if (!interaction.isStringSelectMenu()) return;

	await interaction.update(await buildCategoryPanel(interaction, interaction.values[0]));
});
