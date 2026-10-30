import { formatCredits, giveCredits, takeCredits } from "@/helpers/economy.js";
import { editReplyError, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import {
	evaluate,
	FREE_SPIN_MULTIPLIER,
	FreeSpinsResult,
	Grid,
	PAYLINES,
	playFreeSpins,
	REELS,
	ROWS,
	spinGrid,
	SpinResult,
	STRIPS,
	SYMBOLS,
	toCredits,
} from "@/helpers/slots.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const client = useClient();

const SLOTS_ID = "ECO_SLOTS";
const MIN_BET = 10;
const MAX_BET = 100_000;
const FRAME_DELAY = 650;
const BONUS_DELAY = 1800;
// Multipliers of the bet for the win banners
const WIN_TIERS = [
	[100, "EPIC"],
	[50, "MEGA"],
	[20, "BIG"],
] as const;

type Context = {
	t: (key: string, args?: Record<string, unknown>) => Promise<string>;
	/** Numbers in the format of the server language, the same as in formatCredits */
	num: (n: number) => string;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const clampBet = (bet: number) => Math.min(MAX_BET, Math.max(MIN_BET, Math.round(bet)));

export const data: CommandData = {
	name: "slots",
	...getLocalizedDesc("economy/slots:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "bet",
			...getLocalizedDesc("economy/slots:BET"),
			type: ApplicationCommandOptionType.Integer,
			required: true,
			// eslint-disable-next-line camelcase
			min_value: MIN_BET,
			// eslint-disable-next-line camelcase
			max_value: MAX_BET,
		},
	],
};

const renderGrid = (grid: Grid) =>
	Array.from({ length: ROWS }, (_, row) =>
		Array.from({ length: REELS }, (_, reel) => SYMBOLS[grid[reel][row]]).join("  "),
	).join("\n");

/** Reels from `stopped` on are still spinning and show random symbols */
const spinningGrid = (final: Grid, stopped: number): Grid =>
	final.map((reel, i) =>
		i < stopped
			? reel
			: Array.from({ length: ROWS }, () => STRIPS[i][Math.floor(Math.random() * STRIPS[i].length)]),
	);

const lineSummary = async (spin: SpinResult, bet: number, { t, num }: Context) =>
	(
		await Promise.all(
			spin.lines.map(async line =>
				t("economy/slots:LINE", {
					line: line.line,
					symbol: SYMBOLS[line.symbol],
					count: line.count,
					win: num(toCredits(line.win, bet)),
				}),
			),
		)
	).join("\n");

type Frame = {
	grid: Grid;
	bet: number;
	userId: string;
	body?: string;
	result?: string;
	footer?: string;
	buttons?: boolean;
};

const buildMessage = async ({ grid, bet, userId, body, result, footer, buttons }: Frame, { t, num }: Context) => {
	const container = createContainer()
		.addTextDisplayComponents(
			createText(`## 🎰 ${await t("economy/slots:TITLE")}`),
			createText(`-# ${await t("economy/slots:BET_INFO", { bet: num(bet), lines: PAYLINES.length })}`),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(renderGrid(grid)));

	if (body) container.addSeparatorComponents(createSeparator()).addTextDisplayComponents(createText(body));
	if (result) container.addTextDisplayComponents(createText(result));

	if (buttons) {
		// Each button spins right away with the bet written on it
		const bets = [...new Set([clampBet(bet / 2), bet, clampBet(bet * 2)])];

		container.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				bets.map(target =>
					new ButtonBuilder()
						.setCustomId(`${SLOTS_ID}:${userId}:${target}`)
						.setEmoji("🎰")
						.setLabel(num(target))
						.setStyle(target === bet ? ButtonStyle.Primary : ButtonStyle.Secondary),
				),
			),
		);
	}

	if (footer) container.addTextDisplayComponents(createFooter(footer));

	return { flags: MessageFlags.IsComponentsV2 as const, components: [container], allowedMentions: { parse: [] } };
};

const resultText = async (
	credits: number,
	bet: number,
	{ t }: Context,
	interaction: ButtonInteraction | ChatInputCommandInteraction,
) => {
	if (!credits) return `### ${await t("economy/slots:NO_WIN")}`;

	const tier = WIN_TIERS.find(([multiplier]) => credits >= bet * multiplier);
	const banner = tier ? `🔥 **${tier[1]} WIN** 🔥\n` : "";

	return `${banner}### ${await t("economy/slots:WIN", { credits: await formatCredits(interaction, credits) })}`;
};

const bonusText = async (bonus: FreeSpinsResult, bet: number, { t, num }: Context) => {
	const best = bonus.spins.reduce((a, b) => (b.win > a.win ? b : a));

	return [
		`**${await t("economy/slots:BONUS_RESULT", {
			spins: bonus.spins.length,
			multiplier: FREE_SPIN_MULTIPLIER,
			win: num(toCredits(bonus.win, bet)),
		})}**`,
		best.win ? `${await t("economy/slots:BEST_SPIN")}\n${renderGrid(best.grid)}` : "",
	]
		.filter(Boolean)
		.join("\n");
};

const play = async (interaction: ButtonInteraction | ChatInputCommandInteraction, bet: number) => {
	const ctx: Context = {
		t: (key, args) => translateContext(interaction, key, args),
		num: n => n.toLocaleString(interaction.guildLocale ?? "en-US"),
	};
	const { t, num } = ctx;
	const userId = interaction.user.id;
	const memberData = await client.getMemberData(interaction.guildId!, userId);

	if (!(await takeCredits(memberData, bet))) {
		const args = { credits: await formatCredits(interaction, bet) };

		if (interaction.isButton())
			await interaction.reply({
				content: await t("economy/slots:NOT_ENOUGH", args),
				flags: MessageFlags.Ephemeral,
			});
		else await editReplyError(interaction, "economy/slots:NOT_ENOUGH", args);

		return;
	}

	const spin = evaluate(spinGrid());
	const bonus = spin.freeSpins ? playFreeSpins(spin.freeSpins) : null;
	const credits = toCredits(spin.win + (bonus?.win ?? 0), bet);
	if (credits) await giveCredits(memberData, credits);

	const frame = (grid: Grid, extra: Partial<Frame> = {}) => buildMessage({ grid, bet, userId, ...extra }, ctx);
	const show = async (message: Awaited<ReturnType<typeof frame>>, first = false) => {
		if (first && interaction.isButton()) await interaction.update(message);
		else await interaction.editReply(message);
	};

	await show(await frame(spinningGrid(spin.grid, 0), { footer: await t("economy/slots:SPINNING") }), true);

	for (const stopped of [2, 4]) {
		await sleep(FRAME_DELAY);
		await show(await frame(spinningGrid(spin.grid, stopped), { footer: await t("economy/slots:SPINNING") }));
	}

	await sleep(FRAME_DELAY);

	const lines = await lineSummary(spin, bet, ctx);
	const scatterArgs = { count: spin.scatters, win: num(toCredits(spin.scatterWin, bet)) };
	const scatter = spin.scatters >= 3 ? await t("economy/slots:SCATTER", scatterArgs) : "";
	const baseBody = [lines, scatter].filter(Boolean).join("\n");

	if (bonus) {
		const bonusArgs = { spins: spin.freeSpins, multiplier: FREE_SPIN_MULTIPLIER };

		await show(
			await frame(spin.grid, {
				body: baseBody,
				result: `## ⭐ ${await t("economy/slots:BONUS", bonusArgs)} ⭐`,
				footer: await t("economy/slots:SPINNING"),
			}),
		);
		await sleep(BONUS_DELAY);
	}

	const balance = (await client.getMemberData(interaction.guildId!, userId)).money;

	await show(
		await frame(spin.grid, {
			body: [baseBody, bonus ? await bonusText(bonus, bet, ctx) : ""].filter(Boolean).join("\n\n") || undefined,
			result: await resultText(credits, bet, ctx, interaction),
			footer: await t("economy/slots:BALANCE", { credits: num(balance) }),
			buttons: true,
		}),
	);
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();
	await play(interaction, interaction.options.getInteger("bet", true));
};

componentRouter.register(SLOTS_ID, async interaction => {
	if (!interaction.isButton()) return;

	const [, userId, betText] = interaction.customId.split(":");

	if (interaction.user.id !== userId) {
		await interaction.reply({
			content: await translateContext(interaction, "economy/slots:NOT_YOURS"),
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await play(interaction, clampBet(Number(betText)));
});
