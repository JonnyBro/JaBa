const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('openticketchannel')
		.setDescription('Creates an embed with buttons to open a ticket')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction) {
		// create embed for ticket
		const embed = new EmbedBuilder()
		.setTitle('Tickets')
		.setDescription('Open a ticket by choosing a category below');

		// add button for support and application
		const supportButton = new ButtonBuilder()
			.setCustomId('support')
			.setLabel('Support')
			.setStyle(ButtonStyle.Primary);

		const applicationButton = new ButtonBuilder()
			.setCustomId('application')
			.setLabel('Application')
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder()
			.addComponents(supportButton, applicationButton);

		// send message with buttons
		await interaction.channel.send({ embeds: [embed], components: [row] });
		await interaction.reply('Done');
	},
};