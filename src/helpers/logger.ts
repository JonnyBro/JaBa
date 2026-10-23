import { IS_PROD } from "@/constants/index.js";
import chalk from "chalk";
import { EventEmitter } from "node:events";
import { format as formatArgs } from "node:util";

export type LogLine = { time: number; level: string; text: string };

const BUFFER_SIZE = 500;

const buffer: LogLine[] = [];

/** Recent lines for the dashboard, without the terminal colors */
export const logEvents = new EventEmitter<{ line: [LogLine] }>();

export const getRecentLogs = () => [...buffer];

const record = (level: string, content: unknown[]) => {
	const line = { time: Date.now(), level, text: formatArgs(...content) };

	buffer.push(line);
	if (buffer.length > BUFFER_SIZE) buffer.shift();

	logEvents.emit("line", line);
};

function format(tDate: Date | number) {
	return new Intl.DateTimeFormat("ru-RU", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).format(tDate);
}

const logLevels = {
	CMD: chalk.black("CMD"),
	DEBUG: chalk.magenta("DEBUG"),
	ERROR: chalk.red("ERROR"),
	INFO: chalk.blue("INFO"),
	LOG: chalk.bgBlue("LOG"),
	READY: chalk.green("READY"),
	WARN: chalk.yellow("WARN"),
};

export default {
	cmd(...content: unknown[]) {
		record("CMD", content);
		return console.log(`[${format(Date.now())}]: ${logLevels.CMD}`, ...content);
	},

	debug(...content: unknown[]) {
		if (IS_PROD) return;
		record("DEBUG", content);
		return console.log(`[${format(Date.now())}]: ${logLevels.DEBUG}`, ...content);
	},

	error(...content: unknown[]) {
		const formattedContent = content.map(item => (item instanceof Error ? item.stack || item.toString() : item));
		record("ERROR", formattedContent);
		return console.error(`[${format(Date.now())}]: ${logLevels.ERROR}`, ...formattedContent);
	},

	info(...content: unknown[]) {
		record("INFO", content);
		return console.log(`[${format(Date.now())}]: ${logLevels.INFO}`, ...content);
	},

	log(...content: unknown[]) {
		record("LOG", content);
		return console.log(`[${format(Date.now())}]: ${logLevels.LOG}`, ...content);
	},

	ready(...content: unknown[]) {
		record("READY", content);
		return console.log(`[${format(Date.now())}]: ${logLevels.READY}`, ...content);
	},

	warn(...content: unknown[]) {
		record("WARN", content);
		return console.log(`[${format(Date.now())}]: ${logLevels.WARN}`, ...content);
	},
};
