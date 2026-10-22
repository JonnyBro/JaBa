import { IS_PROD } from "@/constants/index.js";
import chalk from "chalk";

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
		return console.log(`[${format(Date.now())}]: ${logLevels.CMD}`, ...content);
	},

	debug(...content: unknown[]) {
		if (IS_PROD) return;
		return console.log(`[${format(Date.now())}]: ${logLevels.DEBUG}`, ...content);
	},

	error(...content: unknown[]) {
		const formattedContent = content.map(item => (item instanceof Error ? item.stack || item.toString() : item));
		return console.error(`[${format(Date.now())}]: ${logLevels.ERROR}`, ...formattedContent);
	},

	info(...content: unknown[]) {
		return console.log(`[${format(Date.now())}]: ${logLevels.INFO}`, ...content);
	},

	log(...content: unknown[]) {
		return console.log(`[${format(Date.now())}]: ${logLevels.LOG}`, ...content);
	},

	ready(...content: unknown[]) {
		return console.log(`[${format(Date.now())}]: ${logLevels.READY}`, ...content);
	},

	warn(...content: unknown[]) {
		return console.log(`[${format(Date.now())}]: ${logLevels.WARN}`, ...content);
	},
};
