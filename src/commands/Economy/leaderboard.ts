import { formatCredits } from "@/helpers/economy.js";
import { getLocalizedDesc, getNoun, getXpForNextLevel, translateContext } from "@/helpers/functions.js";
import MemberModel from "@/models/MemberModel.js";
import UserModel from "@/models/UserModel.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createSeparator, createText } from "@/utils/create-container.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	Guild,
	Interaction,
	InteractionContextType,
	MessageFlags,
	StringSelectMenuBuilder,
} from "discord.js";

const LEADERBOARD_SELECTOR_ID = "LEADERBOARD_SELECTOR";
const LIMIT = 20;
const FETCH_CHUNK = 100;
const MEDALS = ["🥇", "🥈", "🥉"];

enum LeaderboardType {
	Credits = "credits",
	Level = "level",
	Reputation = "rep",
}

const TYPES = [
	{ value: LeaderboardType.Credits, emoji: "💰", label: "common:CREDITS" },
	{ value: LeaderboardType.Level, emoji: "🆙", label: "common:LEVEL" },
	{ value: LeaderboardType.Reputation, emoji: "😎", label: "common:REP" },
];

type Entry = { id: string; value: number; exp?: number };

export const data: CommandData = {
	name: "leaderboard",
	...getLocalizedDesc("economy/leaderboard:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

/** Keeps the top entries that belong to humans still on the server, the database has bots and members who left */
const topMembers = async (guild: Guild, sorted: Entry[]) => {
	const top: Entry[] = [];

	for (let i = 0; i < sorted.length && top.length < LIMIT; i += FETCH_CHUNK) {
		const chunk = sorted.slice(i, i + FETCH_CHUNK);
		const members = await guild.members.fetch({ user: chunk.map(e => e.id) }).catch(() => null);
		if (!members) continue;

		top.push(...chunk.filter(e => members.get(e.id)?.user.bot === false));
	}

	return top.slice(0, LIMIT);
};

const fetchEntries = async (guild: Guild, type: LeaderboardType) => {
	if (type === LeaderboardType.Reputation) {
		const users = await UserModel.find({ rep: { $gt: 0 } }, { id: 1, rep: 1 })
			.sort({ rep: -1 })
			.lean();

		return topMembers(
			guild,
			users.map(u => ({ id: u.id, value: u.rep })),
		);
	}

	const members = await MemberModel.find(
		{ guildID: guild.id },
		{ id: 1, money: 1, bank: 1, level: 1, exp: 1 },
	).lean();
	const entries: Entry[] =
		type === LeaderboardType.Credits
			? members.map(m => ({ id: m.id, value: m.money + m.bank })).filter(e => e.value > 0)
			: members.map(m => ({ id: m.id, value: m.level, exp: m.exp }));

	return topMembers(
		guild,
		entries.sort((a, b) => b.value - a.value || (b.exp ?? 0) - (a.exp ?? 0)),
	);
};

const nouns = (interaction: Interaction, key: string) =>
	Promise.all(["1", "2", "5"].map(form => translateContext(interaction, `misc:NOUNS:${key}:${form}`)));

const formatEntries = async (interaction: Interaction, type: LeaderboardType, entries: Entry[]) => {
	const [levelNouns, xpNouns, pointNouns] = await Promise.all([
		nouns(interaction, "LEVEL"),
		nouns(interaction, "XP"),
		nouns(interaction, "POINTS"),
	]);

	const lines = await Promise.all(
		entries.map(async (entry, i) => {
			const rank = MEDALS[i] ?? `**${i + 1}.**`;
			let value: string;

			if (type === LeaderboardType.Credits) value = await formatCredits(interaction, entry.value);
			else if (type === LeaderboardType.Level) {
				const xp = `${entry.exp}/${getXpForNextLevel(entry.value)} ${getNoun(entry.exp!, xpNouns)}`;
				value = `**${entry.value}** ${getNoun(entry.value, levelNouns)} · ${xp}`;
			} else value = `**${entry.value}** ${getNoun(entry.value, pointNouns)}`;

			return `${rank} <@${entry.id}> · ${value}`;
		}),
	);

	return lines.join("\n");
};

const render = async (interaction: Interaction, type: LeaderboardType) => {
	const guild = interaction.guild!;
	const entries = await fetchEntries(guild, type);

	const selector = new StringSelectMenuBuilder()
		.setCustomId(LEADERBOARD_SELECTOR_ID)
		.setPlaceholder(await translateContext(interaction, "economy/leaderboard:SELECT"))
		.addOptions(
			await Promise.all(
				TYPES.map(async option => ({
					label: await translateContext(interaction, option.label),
					emoji: option.emoji,
					value: option.value,
					default: option.value === type,
				})),
			),
		);

	const container = createContainer()
		.addTextDisplayComponents(
			createText(`## ${await translateContext(interaction, "economy/leaderboard:TITLE", { name: guild.name })}`),
		)
		.addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selector))
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(
				entries.length
					? await formatEntries(interaction, type, entries)
					: await translateContext(interaction, "economy/leaderboard:EMPTY"),
			),
		);

	return { flags: MessageFlags.IsComponentsV2 as const, components: [container], allowedMentions: { parse: [] } };
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	await interaction.editReply(await render(interaction, LeaderboardType.Credits));
};

componentRouter.register(LEADERBOARD_SELECTOR_ID, async interaction => {
	if (!interaction.isStringSelectMenu()) return;

	const type = interaction.values[0] as LeaderboardType;
	if (!Object.values(LeaderboardType).includes(type)) return;

	await interaction.deferUpdate();
	await interaction.editReply(await render(interaction, type));
});
