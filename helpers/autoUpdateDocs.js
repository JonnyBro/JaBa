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
		let text = `# JaBa имеет свыше **${Math.floor(commands.size / 10)}0 команд** в **${categories.length} категориях**!  \n\n#### Содержимое таблицы  \n**Название**: Название команды  \n**Описание**: Описание команды  \n**Использование**: Использование команды ( [] - обязательно, () - необязательно )  \n**Разрешено использование**: Где можно использовать команду  \n**Откат**: Время, через которое команду можно будет использовать повторно\n\n`;

		// categories.sort(function(a, b) {
		// 	const aCmdsSize = commands.filter((cmd) => cmd.help.category === a).size;
		// 	const bCmdsSize = commands.filter((cmd) => cmd.help.category === b).size;
		// 	if (aCmdsSize > bCmdsSize) return -1;
		// 	else return 1;
		// })
		categories.sort().forEach((cat) => {
			const arrCat = [
				["Название", "Описание", "Использование", "Разрешено использование", "Откат"]
			];
			const cmds = commands.filter((cmd) => cmd.help.category === cat);
			text += `### ${cat} (${cmds.size} ${client.getNoun(cmds.size, "команда", "команды", "команд")})\n\n`;
			cmds.sort(function (a, b) {
				if (a.help.name < b.help.name) return -1;
				else return 1;
			}).forEach((cmd) => {
				arrCat.push([
					`**${cmd.help.name}** ${cmd.help.aliases.length ? `**(${cmd.help.aliases.join(", ")})**` : ""}`,
					client.translate(`${cmd.help.category.toLowerCase()}/${cmd.help.name}:DESCRIPTION`),
					client.translate(`${cmd.help.category.toLowerCase()}/${cmd.help.name}:USAGE`),
					cmd.conf.guildOnly ? "Только на сервере" : "На сервере и в ЛС бота",
					`${Math.ceil(cmd.conf.cooldown / 1000)} ${client.getNoun(Math.ceil(cmd.conf.cooldown / 1000), "секунда", "секунды", "секунд")}`
				]);
			});
			text += `${table(arrCat)}\n\n`;
		});

		if (!fs.existsSync("./dashboard/public/docs")) {
			fs.mkdirSync("./dashboard/public/docs");
			fs.writeFileSync("./dashboard/public/docs/commands.md", text);
			client.logger.log("Dashboard docs updated!");
		} else {
			fs.writeFileSync("./dashboard/public/docs/commands.md", text);
			client.logger.log("Dashboard docs updated!");
		}
	}
};