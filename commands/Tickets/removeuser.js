const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removeuser')
		.setDescription('Remove a user from a ticket')
        .addMentionableOption(option =>
            option.setName('user')
                .setDescription('The user to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	async execute(interaction) {
        try {
            const user = interaction.options.getMentionable('user');
            const currentChannel = interaction.channel;

            if (currentChannel) {
                if (!interaction.channel.name.includes('support') && !interaction.channel.name.includes('application')) {
                    interaction.reply('This command can only be used in a ticket channel.');
                    return;
                }
                const member = await interaction.guild.members.fetch(user.id);
                await interaction.channel.permissionOverwrites.edit(member, { ViewChannel: false });
                interaction.reply(`Removed ${user} to the ticket.`);
            }
            else {
                interaction.reply('This channel is not a ticket.');
            }
        }
        catch (error) {
            console.log(error);
            interaction.reply('Error adding user to ticket.');
        }
	},
};