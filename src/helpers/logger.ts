import useClient from "@/utils/use-client.js";
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
	LOG: chalk.bgBlue("LOG"),
	WARN: chalk.black.bgYellow("WARN"),
	ERROR: chalk.black.bgRed("ERROR"),
	DEBUG: chalk.green("DEBUG"),
	CMD: chalk.black.bgWhite("CMD"),
	READY: chalk.black.bgGreen("READY"),
};

export default {
	log(...content: unknown[]) {
		return console.log(`[${format(Date.now())}]: ${logLevels.LOG} ${content.join(" ")}`);
	},

	warn(...content: unknown[]) {
		return console.log(`[${format(Date.now())}]: ${logLevels.WARN} ${content.join(" ")}`);
	},

	error(...content: unknown[]) {
		return console.log(`[${format(Date.now())}]: ${logLevels.ERROR} ${content.join(" ")}`);
	},

	debug(...content: unknown[]) {
		const client = useClient();
		const isProd = client.configService.get("production");
		console.log(isProd);
		if (isProd) return;
		return console.log(`[${format(Date.now())}]: ${logLevels.DEBUG} ${content.join(" ")}`);
	},

	cmd(...content: unknown[]) {
		return console.log(`[${format(Date.now())}]: ${logLevels.CMD} ${content.join(" ")}`);
	},

	ready(...content: unknown[]) {
		return console.log(`[${format(Date.now())}]: ${logLevels.READY} ${content.join(" ")}`);
	},
};
