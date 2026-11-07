import ms, { StringValue } from "ms";

export const MAX_REMINDS = 25;
export const MAX_REMIND_MESSAGE = 1000;
export const MIN_REMIND_AHEAD_MS = 60_000;
export const MAX_REMIND_AHEAD_MS = 5 * 365 * 24 * 60 * 60 * 1000;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ms only knows English units, so the Russian and Ukrainian ones are added here
const UNITS: Record<string, number> = {
	m: MINUTE,
	min: MINUTE,
	м: MINUTE,
	мин: MINUTE,
	хв: MINUTE,
	h: HOUR,
	ч: HOUR,
	час: HOUR,
	год: HOUR,
	d: DAY,
	д: DAY,
	дн: DAY,
	w: 7 * DAY,
	н: 7 * DAY,
	нед: 7 * DAY,
	тиж: 7 * DAY,
};

/** Reads "90m", "2h30m", "2ч 30мин" or plain minutes, returns milliseconds or null */
export const parseDuration = (input: string) => {
	const text = input.trim().toLowerCase().replace(/\s+/g, "");
	if (!text) return null;
	// ms reads a bare number as milliseconds, nobody means that here
	if (/^\d+$/.test(text)) return Number(text) * MINUTE;

	const plain = ms(text as StringValue);
	if (typeof plain === "number" && plain > 0) return plain;

	const parts = [...text.matchAll(/(\d+)([a-zа-яіїє]+)/g)];
	if (!parts.length || parts.map(part => part[0]).join("") !== text) return null;

	let total = 0;
	for (const [, amount, unit] of parts) {
		if (!UNITS[unit]) return null;
		total += Number(amount) * UNITS[unit];
	}

	return total;
};

export const isValidRemindDelay = (delay: number) => delay >= MIN_REMIND_AHEAD_MS && delay <= MAX_REMIND_AHEAD_MS;
