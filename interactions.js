if (interaction.isModalSubmit()) {
	const age = interaction.fields.getTextInputValue('age');
	const location = interaction.fields.getTextInputValue('location');
	const experience = interaction.fields.getTextInputValue('experience');
	const why = interaction.fields.getTextInputValue('why');

	const embed = new EmbedBuilder()
		.setTitle('Application')
		.setDescription('Thank you for applying to the server!')
		.addFields(
			{ name: 'Age', value: age },
			{ name: 'Location', value: location },
			{ name: 'Experience', value: experience },
			{ name: 'Why', value: why },
		)
		.setColor('#00ff00')
		.setTimestamp();

	// create ticket channel in application category
	const channel = await interaction.guild.channels.create({
		name: `${interaction.user.username}-application`,
		type: ChannelType.GuildText,
		parent: applicationTicketCategory,
		permissionOverwrites: [
			{
				id: interaction.user.id,
				allow: [PermissionsBitField.Flags.ViewChannel],
			},
			{
				id: interaction.guild.roles.everyone,
				deny: [PermissionsBitField.Flags.ViewChannel],
			},
		],
	});

	// for each role in config access_to_ticket array add permission to view channel
	for (const role of access_to_ticket) {
		await channel.permissionOverwrites.edit(role, { ViewChannel: true });
	}

	const pingMessage = access_to_ticket.map(role => `||<@&${role}>||`).join(' ') + ` ||${interaction.user}||`;
		await channel.send(pingMessage);


	// send message to ticket log channel
	const logChannel = interaction.guild.channels.cache.get(ticketLogChannel);
	await logChannel.send(`Ticket created by ${interaction.user} in ${channel}`);

	await interaction.reply({ content: `Your application has been submitted. Please wait for a response from a staff member. ${channel}`, ephemeral: true });

	const closeButton = new ButtonBuilder()
			.setCustomId('close')
			.setLabel('Close')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder()
			.addComponents(closeButton);

	await channel.send({ embeds: [embed], components: [row] });
}
else if (interaction.isButton()) {
	// handle openTicketChannel button interactions here

	// application button ----------------------------------------------------------------------------------------
	const button = interaction.component;
	if (button.customId === 'application') {
		// TODO: Create application embed builder by taking user input

		const modal = new ModalBuilder()
			.setCustomId('application')
			.setTitle('Application');

		const ageInput = new TextInputBuilder()
			.setCustomId('age')
			.setLabel('Enter your age')
			.setStyle(TextInputStyle.Short);

		const locationInput = new TextInputBuilder()
			.setCustomId('location')
			.setLabel('Enter your time zone and country')
			.setStyle(TextInputStyle.Short);

		const experienceInput = new TextInputBuilder()
			.setCustomId('experience')
			.setLabel('Enter your experience with Minecraft')
			.setStyle(TextInputStyle.Paragraph);

		const whyInput = new TextInputBuilder()
			.setCustomId('why')
			.setLabel('Why do you want to join this server?')
			.setStyle(TextInputStyle.Paragraph);

		const modalRow1 = new ActionRowBuilder()
			.addComponents(ageInput);

		const modalRow2 = new ActionRowBuilder()
			.addComponents(locationInput);

		const modalRow3 = new ActionRowBuilder()
			.addComponents(experienceInput);

		const modalRow4 = new ActionRowBuilder()
			.addComponents(whyInput);

		modal.addComponents(modalRow1, modalRow2, modalRow3, modalRow4);

		await interaction.showModal(modal);
	}
	// support button ----------------------------------------------------------------------------------------
	if (button.customId === 'support') {
		const channel = await interaction.guild.channels.create({
			name: `${interaction.user.username}-support`,
			type: ChannelType.GuildText,
			parent: supportTicketCategory,
			permissionOverwrites: [
				{
					id: interaction.user.id,
					allow: [PermissionsBitField.Flags.ViewChannel],
				},
				{
					id: interaction.guild.roles.everyone,
					deny: [PermissionsBitField.Flags.ViewChannel],
				},
			],
		});

		const logChannel = interaction.guild.channels.cache.get(ticketLogChannel);
		const logEmbed = new EmbedBuilder()
			.setTitle('Ticket Created')
			.setDescription(`Ticket created by ${interaction.user} in ${channel}`)
			.setTimestamp()
			.setFooter({ text: 'Bot created by dylancanada' });

		await logChannel.send({ embeds: [logEmbed] });
		await interaction.reply({ content: `Ticket created at ${channel}`, ephemeral: true });

		for (const role of access_to_ticket) {
			await channel.permissionOverwrites.edit(role, { ViewChannel: true });
		}

		const pingMessage = access_to_ticket.map(role => `||<@&${role}>||`).join(' ');
		await channel.send(pingMessage);

		const embed = new EmbedBuilder()
			.setTitle('Support Ticket')
			.setDescription('Ticket created, click the button below to close the ticket')
			.setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
			.addFields({ name: 'Ticket', value: `Please explain your issue ${interaction.user} and someone will be with you shortly`, inline: false })
			.setTimestamp()
			.setFooter({ text: 'Bot created by dylancanada' });

		const closeButton = new ButtonBuilder()
			.setCustomId('close')
			.setLabel('Close')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder()
			.addComponents(closeButton);

		await channel.send({ embeds: [embed], components: [row] });

	}

	if (button.customId === 'close') {
		const closeEmbed = new EmbedBuilder()
			.setTitle('Closing Ticket')
			.setDescription('This ticket will be closed in 5 seconds.')
			.addFields(
				{ name: 'Ticket', value: interaction.channel.name },
				{ name: 'Closed By', value: interaction.user.username },
			)
			.setColor('#ff0000');

		const closeButton = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder()
			.addComponents(closeButton);

		await interaction.reply({ embeds: [closeEmbed], components: [row] });

		const filter = i => i.customId === 'cancel';
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 5000 });

		// eslint-disable-next-line no-unused-vars
		collector.on('collect', async i => {
			await i.update({ content: 'Ticket close cancelled.', components: [] });
			collector.stop();
		});

		collector.on('end', async collected => {
			if (collected.size === 0) {
				const transcriptChannel = interaction.guild.channels.cache.get(ticketTranscriptChannel);
				const reversedMessages = await interaction.channel.messages.fetch({ limit: 100 });

				const messages = Array.from(reversedMessages.values()).reverse();

				let transcript = '';
				messages.forEach(message => {
					transcript += `${message.author.getUsername()}: ${message.content}\n`;
				});

				transcriptChannel.send({ content: `Transcript for ${interaction.channel.name}`, files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });

				try {
					await interaction.user.send({ content: `Here is the transcript for your ticket: ${interaction.channel.name}`, files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });
				}
				catch (error) {
					console.error(error);
					await interaction.reply('An error occurred while trying to send the transcript to the user.');
				}

				await interaction.channel.delete();
			}
		});
	}

	if (button.customId === 'transcript') {
		const transcriptChannel = interaction.guild.channels.cache.get(ticketTranscriptChannel);
		const reversedMessages = await interaction.channel.messages.fetch({ limit: 100 });

		const messages = Array.from(reversedMessages.values()).reverse();

		let transcript = '';
		messages.forEach(message => {
			transcript += `${message.author.username}: ${message.content}\n`;
		});

		transcriptChannel.send({ content: `Transcript for ${interaction.channel.name}`, files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });

		try {
			await interaction.user.send({ content: `Here is the transcript for your ticket: ${interaction.channel.name}`, files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });
		}
		catch (error) {
			console.error(error);
			await interaction.reply('An error occurred while trying to send the transcript to the user.');
		}
	}
}