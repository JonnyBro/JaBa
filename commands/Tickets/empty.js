const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('Replies with test'),
	async execute(interaction) {
		await interaction.reply('test');
	},
};