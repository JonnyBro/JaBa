import { editReplyError, getLocalizedDesc, shortenString, translateContext } from "@/helpers/functions.js";
import {
	addWarn,
	canWarn,
	getWarns,
	getWarnSettings,
	isActive,
	MAX_REASON,
	removeWarn,
	shortId,
} from "@/helpers/warns.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import { containerMessage, createContainer, createSeparator, createText } from "@/utils/create-container.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	GuildMember,
	InteractionContextType,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";

const LIST_SIZE = 15;

const userOption = {
	name: "user",
	...getLocalizedDesc("common:USER"),
	type: ApplicationCommandOptionType.User as const,
	required: true,
};

export const data: CommandData = {
	name: "warn",
	...getLocalizedDesc("administration/warn:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	// eslint-disable-next-line camelcase
	default_member_permissions: String(PermissionsBitField.Flags.ModerateMembers),
	options: [
		{
			name: "add",
			...getLocalizedDesc("administration/warn:ADD"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				userOption,
				{
					name: "reason",
					...getLocalizedDesc("administration/warn:REASON"),
					type: ApplicationCommandOptionType.String,
					// eslint-disable-next-line camelcase
					max_length: MAX_REASON,
				},
			],
		},
		{
			name: "remove",
			...getLocalizedDesc("administration/warn:REMOVE"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				userOption,
				{
					name: "warn",
					...getLocalizedDesc("administration/warn:WARN_OPTION"),
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			name: "list",
			...getLocalizedDesc("administration/warn:LIST"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [userOption],
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	const subcommand = interaction.options.getSubcommand();
	await interaction.deferReply({ flags: subcommand === "add" ? undefined : MessageFlags.Ephemeral });

	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const guild = interaction.guild!;
	const user = interaction.options.getUser("user", true);

	if (subcommand === "add") {
		const target = await guild.members.fetch(user.id).catch(() => null);
		if (!target) return editReplyError(interaction, "misc:USER_NOT_FOUND");
		if (!canWarn(interaction.member as GuildMember, target))
			return editReplyError(interaction, "administration/warn:CANT_WARN");

		const reason = interaction.options.getString("reason")?.trim() || null;
		const { count, punishment, punished } = await addWarn(target, interaction.user.id, reason);

		const outcomeKey = punished ? "administration/warn:LOG_PUNISHED" : "administration/warn:LOG_PUNISH_FAILED";
		const lines = [
			`⚠️ ${await t("administration/warn:ADDED", { user: target.toString(), count })}`,
			`> ${reason ?? (await t("administration/warn:NO_REASON"))}`,
			punishment && `-# ${await t(outcomeKey, { punishment })}`,
		].filter(Boolean);

		return interaction.editReply(
			containerMessage(createContainer().addTextDisplayComponents(createText(lines.join("\n")))),
		);
	}

	if (subcommand === "remove") {
		const warn = await removeWarn(guild, interaction.options.getString("warn", true), interaction.user.id);
		if (!warn || warn.userId !== user.id) return editReplyError(interaction, "administration/warn:NOT_FOUND");

		return interaction.editReply(
			`✅ ${await t("administration/warn:REMOVED", { id: shortId(warn), user: user.toString() })}`,
		);
	}

	const [warns, settings] = await Promise.all([getWarns(guild.id, user.id), getWarnSettings(guild.id)]);
	const active = warns.filter(w => isActive(w, settings)).length;

	const lines = await Promise.all(
		warns.slice(0, LIST_SIZE).map(async warn => {
			const reason = warn.reason ?? (await t("administration/warn:NO_REASON"));
			const time = `<t:${Math.floor(warn.createdAt.getTime() / 1000)}:R>`;
			const line = `\`#${shortId(warn)}\` ${time} · ${shortenString(reason, 100)} · <@${warn.moderatorId}>`;

			return isActive(warn, settings) ? line : `~~${line}~~`;
		}),
	);

	const container = createContainer().addTextDisplayComponents(
		createText(
			`## ⚠️ ${user.username}\n-# ${await t("administration/warn:ACTIVE", { active, total: warns.length })}`,
		),
	);
	if (lines.length)
		container.addSeparatorComponents(createSeparator()).addTextDisplayComponents(createText(lines.join("\n")));

	await interaction.editReply(containerMessage(container));
};

export const autocompleteRun = async ({ interaction }: AutocompleteProps) => {
	const userId = interaction.options.get("user")?.value;
	if (typeof userId !== "string") return interaction.respond([]);

	const [warns, settings] = await Promise.all([
		getWarns(interaction.guildId!, userId),
		getWarnSettings(interaction.guildId!),
	]);
	const query = interaction.options.getFocused().toLowerCase();
	const noReason = await translateContext(interaction, "administration/warn:NO_REASON");

	await interaction.respond(
		warns
			.filter(warn => !warn.removedAt && isActive(warn, settings))
			.map(warn => ({
				name: shortenString(`#${shortId(warn)} · ${warn.reason ?? noReason}`, 100),
				value: warn._id.toString(),
			}))
			.filter(choice => choice.name.toLowerCase().includes(query))
			.slice(0, 25),
	);
};
