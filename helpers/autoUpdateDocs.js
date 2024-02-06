const table = require("markdown-table"),
	fs = require("fs");

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.update = function (client) {
	const commands = [...new Map(client.commands.map(v => [v.constructor.name, v])).values()],
		categories = [];

	commands.forEach(cmd => {
		if (cmd.category === "Owner") return;
		if (!categories.includes(cmd.category)) categories.push(cmd.category);
	});

	let text = `# JaBa has **${commands.length} ${client.functions.getNoun(commands.length, "command", "commands", "commands")}** in **${categories.length} ${client.functions.getNoun(categories.length, "category", "categories", "categories")}**!  \n\n#### Table content  \n**Name**: Command name  \n**Description**: Command description  \n**Usage**: How to use the command (*[]* - required, *()* - optional)  \n**Accessible in**: Where you can use the command  \n\n`;

	categories.sort().forEach(cat => {
		const categoriesArray = [["Name", "Description", "Usage", "Accessible in"]];
		const cmds = [...new Map(commands.filter(cmd => cmd.category === cat).map(v => [v.constructor.name, v])).values()];

		text += `### ${cat} (${cmds.length} ${client.functions.getNoun(cmds.length, "command", "commands", "commands")})\n\n`;
		cmds.sort(function (a, b) {
			if (a.command.name < b.command.name) return -1;
			else return 1;
		}).forEach(cmd => {
			categoriesArray.push([
				`**${cmd.command.name}**`,
				client.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:DESCRIPTION`),
				`${cmd.command.name} ${client.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:USAGE`).replace(/\n/, " \\| ")}`,
				cmd.command.dm_permission ? "Anywhere" : "Servers only",
			]);
		});
		text += `${table(categoriesArray)}\n\n`;
	});

	if (!fs.existsSync("./dashboard/public/docs")) fs.mkdirSync("./dashboard/public/docs");
	fs.writeFileSync("./dashboard/public/docs/commands.md", text);

	client.logger.log("Dashboard docs updated!");
};
