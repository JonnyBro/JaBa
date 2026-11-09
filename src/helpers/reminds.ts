export const MAX_REMINDS = 25;
export const MAX_REMIND_MESSAGE = 1000;
export const MIN_REMIND_AHEAD_MS = 60_000;
export const MAX_REMIND_AHEAD_MS = 5 * 365 * 24 * 60 * 60 * 1000;

export const isValidRemindDelay = (delay: number) => delay >= MIN_REMIND_AHEAD_MS && delay <= MAX_REMIND_AHEAD_MS;
