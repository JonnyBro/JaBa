import { randomInt } from "node:crypto";

export const SYMBOLS = {
	cherry: "🍒",
	lemon: "🍋",
	orange: "🍊",
	watermelon: "🍉",
	grapes: "🍇",
	bell: "🔔",
	diamond: "💎",
	seven: "7️⃣",
	wild: "🃏",
	scatter: "⭐",
} as const;

export type SlotSymbol = keyof typeof SYMBOLS;

export const REELS = 5;
export const ROWS = 3;

/** Multipliers of the line bet for 3, 4 and 5 in a row */
export const PAYTABLE: Record<Exclude<SlotSymbol, "scatter">, [number, number, number]> = {
	cherry: [8, 20, 80],
	lemon: [7, 20, 80],
	orange: [10, 35, 120],
	watermelon: [10, 35, 120],
	grapes: [20, 65, 240],
	bell: [25, 100, 400],
	diamond: [50, 240, 1000],
	seven: [100, 450, 2000],
	wild: [130, 650, 3300],
};

/** Multipliers of the total bet for 3, 4 and 5 scatters anywhere */
export const SCATTER_PAYS = [2, 10, 50] as const;
export const FREE_SPINS = 15;
export const FREE_SPIN_MULTIPLIER = 3;
export const MAX_FREE_SPINS = 100;
export const MAX_WIN_MULTIPLIER = 5000;

/** Row of every reel for each payline, 0 is the top row */
export const PAYLINES: number[][] = [
	[1, 1, 1, 1, 1],
	[0, 0, 0, 0, 0],
	[2, 2, 2, 2, 2],
	[0, 1, 2, 1, 0],
	[2, 1, 0, 1, 2],
	[0, 0, 1, 2, 2],
	[2, 2, 1, 0, 0],
	[1, 0, 0, 0, 1],
	[1, 2, 2, 2, 1],
	[0, 1, 1, 1, 0],
];

// Symbol counts on each reel strip. Wilds never land on the first reel, like on most real machines
const STRIP_COUNTS: Record<SlotSymbol, number>[] = [
	{ cherry: 7, lemon: 7, orange: 6, watermelon: 6, grapes: 5, bell: 4, diamond: 3, seven: 2, wild: 0, scatter: 1 },
	{ cherry: 7, lemon: 7, orange: 6, watermelon: 6, grapes: 5, bell: 4, diamond: 3, seven: 2, wild: 2, scatter: 1 },
	{ cherry: 7, lemon: 7, orange: 6, watermelon: 6, grapes: 5, bell: 4, diamond: 3, seven: 2, wild: 2, scatter: 1 },
	{ cherry: 7, lemon: 7, orange: 6, watermelon: 6, grapes: 5, bell: 4, diamond: 3, seven: 2, wild: 2, scatter: 2 },
	{ cherry: 7, lemon: 7, orange: 6, watermelon: 6, grapes: 5, bell: 4, diamond: 3, seven: 2, wild: 2, scatter: 2 },
];

// A fixed shuffle, so the strips and the return to player stay the same between restarts
const buildStrip = (counts: Record<SlotSymbol, number>, seed: number) => {
	const strip = (Object.entries(counts) as [SlotSymbol, number][]).flatMap(([symbol, n]) => Array(n).fill(symbol));
	let state = seed;

	for (let i = strip.length - 1; i > 0; i--) {
		state = (state * 1103515245 + 12345) % 2 ** 31;
		const j = state % (i + 1);
		[strip[i], strip[j]] = [strip[j], strip[i]];
	}

	return strip as SlotSymbol[];
};

export const STRIPS = STRIP_COUNTS.map((counts, i) => buildStrip(counts, 7919 * (i + 1)));

/** grid[reel][row] */
export type Grid = SlotSymbol[][];

export type LineWin = { line: number; symbol: SlotSymbol; count: number; win: number };

export type SpinResult = {
	grid: Grid;
	lines: LineWin[];
	scatters: number;
	scatterWin: number;
	freeSpins: number;
	/** In line bets, not multiplied by free spins yet */
	win: number;
};

type Random = (max: number) => number;

export const spinGrid = (random: Random = randomInt): Grid =>
	STRIPS.map(strip => {
		const stop = random(strip.length);
		return Array.from({ length: ROWS }, (_, row) => strip[(stop + row) % strip.length]);
	});

type PayingSymbol = Exclude<SlotSymbol, "scatter">;

const pay = (symbol: PayingSymbol, count: number) => (count >= 3 ? PAYTABLE[symbol][count - 3] : 0);

const lineWin = (symbols: SlotSymbol[]): Omit<LineWin, "line"> | null => {
	let wilds = 0;
	while (wilds < REELS && symbols[wilds] === "wild") wilds++;

	// Leading wilds can pay as wilds or stand in for the first real symbol, whichever is worth more
	const target = symbols[wilds];
	let count = wilds;
	if (target && target !== "scatter")
		while (count < REELS && (symbols[count] === target || symbols[count] === "wild")) count++;

	const asTarget = target && target !== "scatter" ? pay(target, count) : 0;
	const asWild = pay("wild", wilds);

	if (!asTarget && !asWild) return null;

	return asWild > asTarget
		? { symbol: "wild", count: wilds, win: asWild }
		: { symbol: target as PayingSymbol, count, win: asTarget };
};

/** Wins of a grid in line bets, the scatter pay is converted from the total bet */
export const evaluate = (grid: Grid): SpinResult => {
	const lines: LineWin[] = [];

	PAYLINES.forEach((rows, line) => {
		const win = lineWin(rows.map((row, reel) => grid[reel][row]));
		if (win) lines.push({ line: line + 1, ...win });
	});

	const scatters = grid.flat().filter(s => s === "scatter").length;
	const scatterWin = scatters >= 3 ? SCATTER_PAYS[Math.min(scatters, 5) - 3] * PAYLINES.length : 0;

	return {
		grid,
		lines,
		scatters,
		scatterWin,
		freeSpins: scatters >= 3 ? FREE_SPINS : 0,
		win: lines.reduce((sum, l) => sum + l.win, 0) + scatterWin,
	};
};

export type FreeSpinsResult = { spins: SpinResult[]; win: number };

/** Free spins are played out at once, a retrigger adds more until the cap */
export const playFreeSpins = (count: number, random?: Random): FreeSpinsResult => {
	const spins: SpinResult[] = [];
	let left = count;
	let total = count;

	while (left > 0) {
		const spin = evaluate(spinGrid(random));
		spins.push(spin);
		left--;

		const extra = Math.min(spin.freeSpins, MAX_FREE_SPINS - total);
		left += extra;
		total += extra;
	}

	return { spins, win: spins.reduce((sum, s) => sum + s.win * FREE_SPIN_MULTIPLIER, 0) };
};

/** Turns line bet units into credits, rounding down and keeping the max win cap */
export const toCredits = (lineBetUnits: number, bet: number) =>
	Math.min(Math.floor((lineBetUnits * bet) / PAYLINES.length), bet * MAX_WIN_MULTIPLIER);
