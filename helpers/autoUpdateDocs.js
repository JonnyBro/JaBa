/* THIS UPDATES THE DOCS */
module.exports = {
	/**
	 * Update the doc
	 * @param {object} client The Discord Client instance
	 */
	update(client) {
		const table = require("markdown-table");
		const fs = require("fs");
		const commands = client.commands;
		const categories = [];
		commands.forEach((cmd) => {
			if (!categories.includes(cmd.help.category)) categories.push(cmd.help.category);
		});
		let text = `# Команды  \nСписок команд JaBa и их описания. JaBa имеет около **${Math.floor(commands.size/10)}0 команд** в **${categories.length} категориях**!  \n\n#### Содержимое таблицы  \n**Название**: Название команды  \n**Описание**: Описание команды  \n**Использование**: Использование команды ([] - обязательно, () - необязательно)  \n**Откат**: Время, через которое команду можно будет использовать повторно\n\n`;

		categories.sort(function(a, b) {
			const aCmdsLength = commands.filter((cmd) => cmd.help.category === a).array().length;
			const bCmdsLength = commands.filter((cmd) => cmd.help.category === b).array().length;
			if (aCmdsLength > bCmdsLength) {
				return -1;
			} else {
				return 1;
			};
		}).forEach((cat) => {
			const arrCat = [
				[ "Название", "Описание", "Использование", "Откат" ]
			];
			const cmds = commands.filter((cmd) => cmd.help.category === cat).array();
			text += `### ${cat} (${cmds.length} команд(а/ы))\n\n`;
			cmds.sort(function(a, b) {
				if (a.help.name < b.help.name) {
					return -1;
				} else {
					return 1;
				};
			}).forEach((cmd) => {
				arrCat.push([
					`**${cmd.help.name}**`,
					client.translate(`${cmd.help.category.toLowerCase()}/${cmd.help.name}:DESCRIPTION`),
					client.translate(`${cmd.help.category.toLowerCase()}/${cmd.help.name}:USAGE`),
					Math.ceil(cmd.conf.cooldown / 1000)+" секунд(а/ы)"
				]);
			});
			text += `${table(arrCat)}\n\n`;
		});

		if (fs.existsSync("./dashboard/views/docs")) {
			fs.writeFileSync("./dashboard/views/docs/commands.md", text);
			client.logger.log("Dashboard docs updated!");
		};

		if (fs.existsSync("./docs")) {
			fs.writeFileSync("./docs/commands.md", text);
			client.logger.log("Docs updated!");
		};
	}
};