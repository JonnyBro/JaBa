const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("rename")
		.setDescription("Renames the ticket channel. Usage: /rename <new name>")
		.addStringOption(option => option.setName("newname").setDescription("The new name for the ticket channel").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	async execute(interaction) {
		try {
			const newName = interaction.options.getString("newname");
			if (!interaction.channel.name.includes("support")) {
				interaction.reply("This command can only be used in a ticket channel.");
				return;
			}
			await interaction.channel.setName(newName + "-" + interaction.channel.name.split("-")[1]);
			interaction.reply(`Renamed the ticket channel to ${newName}`);
		} catch (error) {
			console.error(error);
			interaction.reply("An error occurred while trying to rename the ticket channel.");
		}
	},
};
