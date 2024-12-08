import chalk from "chalk";

function format(tDate) {
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
	log(content) {
		return console.log(`[${format(Date.now())}]: ${logLevels.LOG} ${content}`);
	},

	warn(content) {
		return console.log(`[${format(Date.now())}]: ${logLevels.WARN} ${content}`);
	},

	error(content) {
		return console.log(`[${format(Date.now())}]: ${logLevels.ERROR} ${content}`);
	},

	debug(content) {
		return console.log(`[${format(Date.now())}]: ${logLevels.DEBUG} ${content}`);
	},

	cmd(content) {
		return console.log(`[${format(Date.now())}]: ${logLevels.CMD} ${content}`);
	},

	ready(content) {
		return console.log(`[${format(Date.now())}]: ${logLevels.READY} ${content}`);
	},
};
