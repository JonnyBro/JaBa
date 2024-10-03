const table = require("markdown-table"),
	fs = require("fs");

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.update = function (client) {
	const commands = [...new Map(client.commands.map(v => [v.constructor.name, v])).values()];
	const categories = [];

	// Collect unique command categories, ignoring the "Owner" category
	commands.forEach(cmd => {
		if (!categories.includes(cmd.category)) categories.push(cmd.category);
	});

	// Build the initial text for the documentation
	let text = `# JaBa has **${commands.length} ${client.functions.getNoun(commands.length, "command", "commands", "commands")}** in **${categories.length} ${client.functions.getNoun(categories.length, "category", "categories", "categories")}**!  \n\n` +
		"#### Table content  \n" +
		"**Name**: Command name  \n" +
		"**Description**: Command description  \n" +
		"**Usage**: How to use the command (*[]* - required, *()* - optional)  \n" +
		"**Accessible in**: Where you can use the command  \n\n";

	// Sort categories and generate command documentation for each category
	categories.sort().forEach(cat => {
		const categoriesArray = [["Name", "Description", "Usage", "Accessible in"]];
		const cmds = commands.filter(cmd => cmd.category === cat);

		text += `### ${cat} (${cmds.length} ${client.functions.getNoun(cmds.length, "command", "commands", "commands")})\n\n`;

		// Sort commands alphabetically by name
		cmds.sort((a, b) => a.command.name.localeCompare(b.command.name)).forEach(cmd => {
			categoriesArray.push([
				`**${cmd.command.name}**`,
				client.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:DESCRIPTION`),
				`${cmd.command.name} ${client.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:USAGE`).replace(/\n/, " \\| ")}`,
				cmd.command.dm_permission ? "Anywhere" : "Servers only",
			]);
		});

		// Append the generated table to the documentation text
		text += `${table(categoriesArray)}\n\n`;
	});

	// Ensure the output directory exists
	const outputDir = "./dashboard/public/docs";
	if (!fs.existsSync(outputDir))
		fs.mkdirSync(outputDir, { recursive: true });

	// Write the generated documentation to a Markdown file
	fs.writeFileSync(`${outputDir}/commands.md`, text);

	client.logger.log("Dashboard docs updated!");
};
