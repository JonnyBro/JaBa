const { ButtonBuilder, ActionRowBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require("discord.js");
const BaseEvent = require("../base/BaseEvent");

class CommandHandler extends BaseEvent {
	constructor() {
		super({
			name: "interactionCreate",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../base/Client")} client
	 * @param {import("discord.js").ButtonInteraction} interaction
	 */
	async execute(client, interaction) {
		if (!interaction.isButton()) return;
		if (!interaction.customId.startsWith("ticket_")) return;

		const button = interaction.component;

		interaction.data = [];
		interaction.data.guild = await client.getGuildData(interaction.guildId);

		if (button.customId === "ticket_create") {
			const guildData = interaction.data.guild,
				ticketsCategory = guildData.plugins.tickets.ticketsCategory,
				ticketLogs = guildData.plugins.tickets.ticketLogs;

			if (interaction.guild.channels.cache.get(ticketsCategory).children.cache.size >= 50) {
				const sorted = interaction.guild.channels.cache.get(ticketsCategory).children.cache.sort((ch1, ch2) => ch1.createdTimestamp - ch2.createdTimestamp);

				await sorted.first().delete();
			}

			if (guildData.plugins.tickets.count === undefined) guildData.plugins.tickets.count = 0;

			const channel = await interaction.guild.channels.create({
				name: `${interaction.user.username}-support-${guildData.plugins.tickets.count}`,
				topic: interaction.user.id,
				type: ChannelType.GuildText,
				parent: ticketsCategory,
				permissionOverwrites: [
					{
						id: interaction.user.id,
						allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
					},
					{
						id: interaction.guild.roles.everyone,
						deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
					},
				],
			});

			const logChannel = interaction.guild.channels.cache.get(ticketLogs);
			const logEmbed = client.embed({
				title: interaction.translate("tickets/createticketembed:TICKET_CREATED_TITLE"),
				description: `${interaction.user.toString()} (${channel.toString()})`,
			});

			await logChannel.send({ embeds: [logEmbed] });
			await interaction.success("tickets/createticketembed:TICKET_CREATED", {
				channel: channel.toString(),
			}, { ephemeral: true });

			await channel.send(`<@${interaction.user.id}>`);

			const embed = client.embed({
				author: {
					name: interaction.user.getUsername(),
					iconURL: interaction.user.displayAvatarURL(),
				},
				title: "Support Ticket",
				description: interaction.translate("tickets/createticketembed:TICKET_CREATED_DESC"),
			});

			const closeButton = new ButtonBuilder()
				.setCustomId("close_ticket")
				.setLabel(interaction.translate("tickets/closeticket:CLOSE_TICKET"))
				.setStyle(ButtonStyle.Danger);
			const transcriptButton = new ButtonBuilder()
				.setCustomId("transcript_ticket")
				.setLabel(interaction.translate("tickets/closeticket:TRANSCRIPT_TICKET"))
				.setStyle(ButtonStyle.Secondary);
			const row = new ActionRowBuilder().addComponents(closeButton, transcriptButton);

			guildData.plugins.tickets.count++;
			await guildData.save();

			await channel.send({ embeds: [embed], components: [row] });
		} else if (button.customId === "ticket_close") {
			const embed = client.embed({
				title: interaction.translate("tickets/closeticket:CLOSING_TITLE"),
				description: interaction.translate("tickets/closeticket:CLOSING_DESC"),
				fields: [
					{
						name: interaction.translate("common:TICKET"),
						value: interaction.channel.name,
					},
					{
						name: interaction.translate("tickets/closeticket:CLOSING_BY"),
						value: interaction.user.getUsername(),
					},
				],
			});

			const button = new ButtonBuilder().setCustomId("cancel_closing").setLabel(interaction.translate("common:CANCEL")).setStyle(ButtonStyle.Danger);
			const row = new ActionRowBuilder().addComponents(button);

			await interaction.reply({
				embeds: [embed],
				components: [row],
			});

			const filter = i => i.customId === "cancel_closing";
			const collector = interaction.channel.createMessageComponentCollector({ filter, time: 5000 });

			collector.on("collect", async i => {
				await i.update({ content: interaction.translate("tickets/closeticket:CLOSING_CANCELED"), components: [] });
				collector.stop("canceled");
			});

			collector.on("end", async (_, reason) => {
				if (reason !== "canceled") {
					const reversedMessages = (await interaction.channel.messages.fetch()).filter(m => !m.author.bot),
						messages = Array.from(reversedMessages.values()).reverse(),
						transcriptionLogs = interaction.data.guild.plugins.tickets.transcriptionLogs,
						ticketLogs = interaction.data.guild.plugins.tickets.ticketLogs;

					if (messages.length > 1) {
						let transcript = "---- TICKET CREATED ----\n";
						messages.forEach(message => {
							transcript += `[${client.functions.printDate(client, message.createdTimestamp, null, interaction.getLocale())}] ${message.author.getUsername()}: ${message.content}\n`;
						});
						transcript += "---- TICKET CLOSED ----\n";

						if (transcriptionLogs !== null) interaction.guild.channels.cache.get(transcriptionLogs).send({ content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: `<#${interaction.channelId}>` }), files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });

						try {
							await interaction.user.send({
								content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: interaction.channel.name }),
								files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }],
							});
						} catch (e) {
							interaction.followUp({ content: interaction.translate("misc:CANT_DM"), ephemeral: true });
						}
					}

					const logChannel = interaction.guild.channels.cache.get(ticketLogs);
					const logEmbed = client.embed({
						title: interaction.translate("tickets/createticketembed:TICKET_CLOSED_TITLE"),
						description: `${interaction.user.toString()} (${interaction.channel.toString()})`,
					});

					logChannel.send({ embeds: [logEmbed] });

					interaction.channel.send("Closed!");

					const member = interaction.guild.members.cache.find(u => u.user.id === interaction.channel.topic);

					await interaction.channel.permissionOverwrites.edit(member, { ViewChannel: false, SendMessages: null });
					await interaction.channel.setName(`${interaction.channel.name}-closed`);
				}
			});
		} else if (button.customId === "ticket_transcript") {
			await interaction.deferUpdate();

			const reversedMessages = (await interaction.channel.messages.fetch()).filter(m => !m.author.bot);
			const messages = Array.from(reversedMessages.values()).reverse();

			if (messages.length > 1) {
				let transcript = "---- TICKET CREATED ----\n";
				messages.forEach(message => {
					transcript += `[${client.functions.printDate(client, message.createdTimestamp, null, interaction.getLocale())}] ${message.author.getUsername()}: ${message.content}\n`;
				});
				transcript += "---- TICKET CLOSED ----\n";

				try {
					await interaction.user.send({
						content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: `<#${interaction.channelId}>` }),
						files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }],
					});
				} catch (error) {
					interaction.followUp({ content: interaction.translate("misc:CANT_DM"), ephemeral: true });
				}
			} else return;
		}
	}
}

module.exports = CommandHandler;
