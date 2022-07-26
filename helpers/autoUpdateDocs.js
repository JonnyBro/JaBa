module.exports.update = function (client) {
	const table = require("markdown-table"),
		fs = require("fs"),
		commands = client.commands,
		categories = [],
		length = [...new Map(commands.map(v => [v.constructor.name, v])).values()].length;
	commands.forEach((cmd) => {
		if (!categories.includes(cmd.category)) categories.push(cmd.category);
	});
	let text = `# JaBa имеет **${length} ${client.getNoun(length, "команда", "команды", "команд")}** в **${categories.length} ${client.getNoun(categories.length, "категории", "категориях", "категориях")}**!  \n\n#### Содержимое таблицы  \n**Название**: Название команды  \n**Описание**: Описание команды  \n**Использование**: Использование команды ( [] - обязательно, () - необязательно )  \n**Разрешено использование**: Где можно использовать команду  \n\n`;
	// categories.sort(function(a, b) {
	// 	const aCmdsSize = commands.filter((cmd) => cmd.category === a).size;
	// 	const bCmdsSize = commands.filter((cmd) => cmd.category === b).size;
	// 	if (aCmdsSize > bCmdsSize) return -1;
	// 	else return 1;
	// })
	categories.sort().forEach((cat) => {
		const categoriesArray = [
			["Название", "Описание", "Использование", "Разрешено использование"]
		];
		const cmds = commands.filter((cmd) => cmd.category === cat),
			length = [...new Map(cmds.map(v => [v.constructor.name, v])).values()].length;
		text += `### ${cat} (${length} ${client.getNoun(length, "команда", "команды", "команд")})\n\n`;
		cmds.sort(function (a, b) {
			if (a.command.name < b.command.name) return -1;
			else return 1;
		}).forEach((cmd) => {
			categoriesArray.push([
				`**${cmd.command.name}** ${cmd.aliases.length ? `**(${cmd.aliases.join(", ")})**` : ""}`,
				client.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:DESCRIPTION`),
				`${cmd.command.name} ${client.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:USAGE`)}`,
				cmd.guildOnly ? "Только на сервере" : "На сервере и в ЛС бота"
			]);
		});
		text += `${table(categoriesArray)}\n\n`;
	});
	if (!fs.existsSync("./dashboard/public/docs")) fs.mkdirSync("./dashboard/public/docs");
	fs.writeFileSync("./dashboard/public/docs/commands.md", text);
	client.logger.log("Dashboard docs updated!");
};