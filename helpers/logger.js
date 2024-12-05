import { bgBlue, black, green } from "chalk";

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

export default {
	log(content) {
		return console.log(`[${format(new Date(Date.now()))}]: ${bgBlue("LOG")} ${content}`);
	},

	warn(content) {
		return console.log(`[${format(new Date(Date.now()))}]: ${black.bgYellow("WARN")} ${content}`);
	},

	error(content) {
		return console.log(`[${format(new Date(Date.now()))}]: ${black.bgRed("ERROR")} ${content}`);
	},

	debug(content) {
		return console.log(`[${format(new Date(Date.now()))}]: ${green("DEBUG")} ${content}`);
	},

	cmd(content) {
		return console.log(`[${format(new Date(Date.now()))}]: ${black.bgWhite("CMD")} ${content}`);
	},

	ready(content) {
		return console.log(`[${format(new Date(Date.now()))}]: ${black.bgGreen("READY")} ${content}`);
	},
};
