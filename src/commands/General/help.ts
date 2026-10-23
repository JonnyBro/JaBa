import {
	getCategoryFromPath,
	getCommandType,
	getDescriptionKey,
	getLocaleNamespace,
	isContextCommand,
} from "@/helpers/commands.js";
import { capitalizeString, editReplyError, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationCommandType,
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

type Command = (typeof client.commands)[number];

const getDescription = (interaction: Interaction, cmd: Command) =>
	translateContext(interaction, getDescriptionKey(cmd));

const getDisplayName = async (interaction: Interaction, cmd: Command) =>
	isContextCommand(cmd)
		? translateContext(interaction, `${getLocaleNamespace(cmd)}:CONTEXT_NAME`)
		: `/${cmd.data.name}`;

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
		const toLines = (cmds: Command[]) =>
			Promise.all(
				cmds.map(
					async cmd =>
						`**${await getDisplayName(interaction, cmd)}** - ${await getDescription(interaction, cmd)}`,
				),
			);

		const slashLines = await toLines(commands.filter(cmd => !isContextCommand(cmd)));
		const contextLines = await toLines(commands.filter(isContextCommand));

		container
			.addTextDisplayComponents(
				createText(`-# ${await t("general/help:COMMANDS_IN", { category: capitalizeString(selected) })}`),
			)
			.addSeparatorComponents(createSeparator());

		if (slashLines.length) container.addTextDisplayComponents(createText(slashLines.join("\n")));
		if (slashLines.length && contextLines.length) container.addSeparatorComponents(createSeparator());
		if (contextLines.length)
			container.addTextDisplayComponents(
				createText(`**${await t("general/help:CONTEXT_MENU")}**\n${contextLines.join("\n")}`),
			);
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

const toCodeLines = (text: string, prefix: string) =>
	text
		.split("\n")
		.filter(Boolean)
		.map(line => `\`${prefix}${line}\``)
		.join("\n");

async function getUsageLines(interaction: Interaction, cmd: Command, displayName: string) {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const title = `**${await t("general/help:FIELD_USAGE")}**`;

	if (isContextCommand(cmd)) {
		const key =
			getCommandType(cmd) === ApplicationCommandType.User
				? "general/help:CONTEXT_USAGE_USER"
				: "general/help:CONTEXT_USAGE_MESSAGE";

		return [title, await t(key, { name: displayName })];
	}

	const namespace = getLocaleNamespace(cmd);
	const name = cmd.data.name;

	return [
		title,
		toCodeLines(await t(`${namespace}:USAGE`), `/${name} `) || (await t("misc:NO_ARGS")),
		"",
		`**${await t("general/help:FIELD_EXAMPLES")}**`,
		toCodeLines(await t(`${namespace}:EXAMPLES`), "/") || `\`/${name}\``,
	];
}

async function buildCommandHelp(interaction: Interaction, cmd: Command) {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const category = getCategoryFromPath(cmd.filePath);
	const displayName = await getDisplayName(interaction, cmd);

	const guildOnly = !!cmd.data.contexts && cmd.data.contexts.every(c => c === InteractionContextType.Guild);
	const permissions = cmd.data.default_member_permissions
		? new PermissionsBitField(BigInt(cmd.data.default_member_permissions)).toArray()
		: [];
	const context = await t(guildOnly ? "general/help:GUILD_ONLY" : "general/help:NOT_GUILD_ONLY");
	const usageLines = await getUsageLines(interaction, cmd, displayName);

	const container = createContainer()
		.addTextDisplayComponents(
			createText(
				[
					`## ${displayName}`,
					`-# ${capitalizeString(category)} • ${context}`,
					await getDescription(interaction, cmd),
				].join("\n"),
			),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(
				[
					...usageLines,
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
