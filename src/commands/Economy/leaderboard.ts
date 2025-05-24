import {
	getLocalizedDesc,
	getNoun,
	getXpForNextLevel,
	translateContext,
} from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	TextDisplayBuilder,
} from "discord.js";

const client = useClient();

interface LeaderboardEntry {
	id: string;
	value: number;
	extra?: number;
}

type NounKeys = [string, string, string];

enum LeaderboardType {
	Credits = "credits",
	Level = "level",
	Reputation = "rep",
}

const LEADERBOARD_SELECTOR_ID = "leaderboard_selector";

async function fetchAndBuildEntries<T>(
	fetcher: () => Promise<T[]>,
	valueExtractor: (item: T) => number,
	extraExtractor?: (item: T) => number,
	limit = 20,
): Promise<LeaderboardEntry[]> {
	const items = await fetcher();
	const entries: LeaderboardEntry[] = items.map(i => ({
		id: (i as any).id,
		value: valueExtractor(i),
		extra: extraExtractor?.(i),
	}));

	return entries.sort((a, b) => b.value - a.value).slice(0, limit);
}

function buildTableText(
	entries: LeaderboardEntry[],
	nouns: NounKeys,
	extraNouns?: string[],
	formatExtra?: (entry: LeaderboardEntry) => string,
): string {
	return entries
		.map((e, i) => {
			const rank = `**${i + 1}**`;
			const main = `<@${e.id}>: **${e.value}** ${getNoun(e.value, nouns)}`;
			const extra =
				formatExtra?.(e) ??
				(e.extra && extraNouns ? ` (${e.extra} ${getNoun(e.extra, extraNouns)})` : "");
			return `${rank}. ${main} ${extra}`;
		})
		.join("\n");
}

async function renderLeaderboard(
	interaction: StringSelectMenuInteraction,
	titleKey: string,
	subTitleKey: string,
	tableContent: string,
) {
	const container = new ContainerBuilder();
	const title = new TextDisplayBuilder().setContent(
		`# ${await translateContext(interaction, titleKey, {
			name: interaction.guild?.name,
		})}`,
	);
	const subtitle = new TextDisplayBuilder().setContent(
		`## ${await translateContext(interaction, subTitleKey)}`,
	);

	container
		.addTextDisplayComponents(title)
		.addSeparatorComponents(s => s.setSpacing(SeparatorSpacingSize.Small))
		.addTextDisplayComponents(subtitle)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(tableContent));

	return container;
}

export const data: CommandData = {
	name: "leaderboard",
	...getLocalizedDesc("economy/leaderboard:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const container = new ContainerBuilder();
	const titleText = new TextDisplayBuilder().setContent(
		`# ${await translateContext(interaction, "economy/leaderboard:TITLE", {
			name: interaction.guild?.name,
		})}`,
	);

	const selectText = new TextDisplayBuilder().setContent(
		await translateContext(interaction, "economy/leaderboard:SELECT", {
			name: `**${interaction.guild?.name}**`,
		}),
	);

	const selector = new StringSelectMenuBuilder()
		.setCustomId(LEADERBOARD_SELECTOR_ID)
		.setPlaceholder(await translateContext(interaction, "misc:SELECT_PLACEHOLDER"))
		.addOptions(
			{
				label: await translateContext(interaction, "common:CREDITS"),
				emoji: "💰",
				value: LeaderboardType.Credits,
			},
			{
				label: await translateContext(interaction, "common:LEVEL"),
				emoji: "🆙",
				value: LeaderboardType.Level,
			},
			{
				label: await translateContext(interaction, "common:REP"),
				emoji: "😎",
				value: LeaderboardType.Reputation,
			},
		);
	container
		.addTextDisplayComponents(titleText)
		.addSeparatorComponents(s => s.setSpacing(SeparatorSpacingSize.Small))
		.addTextDisplayComponents(selectText)
		.addActionRowComponents(
			new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selector),
		);

	await interaction.editReply({
		flags: MessageFlags.IsComponentsV2,
		components: [container],
	});
};

// Handle leaderboard selector
client.on("interactionCreate", async interaction => {
	if (!interaction.isStringSelectMenu()) return;
	if (interaction.customId !== LEADERBOARD_SELECTOR_ID) return;

	const selected = interaction.values[0];
	const membersData = client.getMembersData(interaction.guildId!);

	switch (selected) {
		case LeaderboardType.Credits: {
			const entries = await fetchAndBuildEntries(
				() => membersData.then(members => Array.from(members.values())),
				member => member.money + member.bankSold,
			);

			const nouns = await Promise.all([
				translateContext(interaction, "misc:NOUNS:CREDIT:1"),
				translateContext(interaction, "misc:NOUNS:CREDIT:2"),
				translateContext(interaction, "misc:NOUNS:CREDIT:5"),
			]);

			const tableText = buildTableText(entries, nouns);

			const container = await renderLeaderboard(
				interaction,
				"economy/leaderboard:TITLE",
				"common:CREDITS",
				tableText,
			);

			await interaction.message.edit({
				components: [container],
				allowedMentions: {
					parse: [],
				},
			});

			break;
		}

		case LeaderboardType.Level: {
			const entries = await fetchAndBuildEntries(
				() => membersData.then(members => Array.from(members.values())),
				member => member.level,
				member => member.exp,
			);

			const levelNouns = await Promise.all([
				translateContext(interaction, "misc:NOUNS:LEVEL:1"),
				translateContext(interaction, "misc:NOUNS:LEVEL:2"),
				translateContext(interaction, "misc:NOUNS:LEVEL:5"),
			]);

			const xpNouns = await Promise.all([
				translateContext(interaction, "misc:NOUNS:XP:1"),
				translateContext(interaction, "misc:NOUNS:XP:2"),
				translateContext(interaction, "misc:NOUNS:XP:5"),
			]);

			const tableText = buildTableText(entries, levelNouns, xpNouns, entry => {
				const nextXp = getXpForNextLevel(entry.value);
				return `(${entry.extra} / ${nextXp} ${getNoun(entry.extra!, xpNouns)})`;
			});

			const container = await renderLeaderboard(
				interaction,
				"economy/leaderboard:TITLE",
				"common:LEVEL",
				tableText,
			);

			await interaction.message.edit({
				components: [container],
				allowedMentions: {
					parse: [],
				},
			});

			break;
		}

		case LeaderboardType.Reputation: {
			const entries = await fetchAndBuildEntries(
				() => client.getUsersData().then(users => Array.from(users.values())),
				user => user.rep,
			);

			const nouns = await Promise.all([
				translateContext(interaction, "misc:NOUNS:POINTS:1"),
				translateContext(interaction, "misc:NOUNS:POINTS:2"),
				translateContext(interaction, "misc:NOUNS:POINTS:5"),
			]);

			const tableText = buildTableText(entries, nouns);

			const container = await renderLeaderboard(
				interaction,
				"economy/leaderboard:TITLE",
				"common:REP",
				tableText,
			);

			await interaction.message.edit({
				components: [container],
				allowedMentions: {
					parse: [],
				},
			});

			break;
		}

		default:
			await interaction.message.edit({ content: "Invalid selection." });
	}
});
