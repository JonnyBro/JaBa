import logger from "@/helpers/logger.js";
import CommandUsageModel from "@/models/CommandUsageModel.js";

const FLUSH_INTERVAL = 60_000;

const pending = new Map<string, number>();

const today = () => new Date().toISOString().slice(0, 10);

export const recordCommandUsage = (command: string) => {
	const key = `${today()}|${command}`;
	pending.set(key, (pending.get(key) ?? 0) + 1);
};

const flush = async () => {
	if (!pending.size) return;

	const entries = [...pending.entries()];
	pending.clear();

	await CommandUsageModel.bulkWrite(
		entries.map(([key, count]) => {
			const [day, command] = key.split("|");

			return { updateOne: { filter: { day, command }, update: { $inc: { count } }, upsert: true } };
		}),
	).catch(error => logger.warn("[Stats] Failed to save command usage:", error));
};

export const startCommandStats = () => setInterval(() => void flush(), FLUSH_INTERVAL).unref();
