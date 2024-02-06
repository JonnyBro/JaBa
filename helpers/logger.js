const { bgBlue, black, green } = require("chalk");

function dateTimePad(value, digits) {
	let number = value;
	while (number.toString().length < digits) number = "0" + number;

	return number;
}

function format(tDate) {
	return (
		dateTimePad(tDate.getDate(), 2) +
		"-" +
		dateTimePad(tDate.getMonth() + 1, 2) +
		"-" +
		dateTimePad(tDate.getFullYear(), 2) +
		" " +
		dateTimePad(tDate.getHours(), 2) +
		":" +
		dateTimePad(tDate.getMinutes(), 2) +
		":" +
		dateTimePad(tDate.getSeconds(), 2) +
		"." +
		dateTimePad(tDate.getMilliseconds(), 3)
	);
}

module.exports = class Logger {
	static log(content) {
		const date = `[${format(new Date(Date.now()))}]:`;

		return console.log(`${date} ${bgBlue("LOG")} ${content}`);
	}

	static warn(content) {
		const date = `[${format(new Date(Date.now()))}]:`;

		return console.log(`${date} ${black.bgYellow("WARN")} ${content}`);
	}

	static error(content) {
		const date = `[${format(new Date(Date.now()))}]:`;

		return console.log(`${date} ${black.bgRed("ERROR")} ${content}`);
	}

	static debug(content) {
		const date = `[${format(new Date(Date.now()))}]:`;

		return console.log(`${date} ${green("DEBUG")} ${content}`);
	}

	static cmd(content) {
		const date = `[${format(new Date(Date.now()))}]:`;

		return console.log(`${date} ${black.bgWhite("CMD")} ${content}`);
	}

	static ready(content) {
		const date = `[${format(new Date(Date.now()))}]:`;

		return console.log(`${date} ${black.bgGreen("READY")} ${content}`);
	}
};
