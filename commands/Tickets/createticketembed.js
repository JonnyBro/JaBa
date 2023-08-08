const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class CreateTicketEmbed extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("createticketembed")
				.setDescription(client.translate("tickets/createticketembed:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("tickets/createticketembed:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("tickets/createticketembed:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad(client) {
		client.on("interactionCreate", async interaction => {
			if (!interaction.isButton()) return;

			const guildData = await client.findOrCreateGuild({ id: interaction.guildId });

			const ticketsCategory = guildData.plugins.tickets.ticketsCategory,
				ticketLogs = guildData.plugins.tickets.ticketLogs,
				transcriptionLogs = guildData.plugins.tickets.transcriptionLogs;

			if (interaction.isButton()) {
				const button = interaction.component;

				if (button.customId === "support_ticket") {
					if (guildData.plugins.tickets.count === undefined) guildData.plugins.tickets.count = 0;

					guildData.plugins.tickets.count++;
					guildData.markModified("plugins.tickets");
					guildData.save();

					const channel = await interaction.guild.channels.create({
						name: `${interaction.user.username}-support-${guildData.plugins.tickets.count}`,
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
					const logEmbed = new EmbedBuilder()
						.setTitle(interaction.translate("tickets/createticketembed:TICKET_CREATED_TITLE"))
						.setDescription(`${interaction.user.toString()} (${channel.toString()})`)
						.setColor(client.config.embed.color)
						.setFooter(client.config.embed.footer)
						.setTimestamp();

					await logChannel.send({ embeds: [logEmbed] });
					await interaction.success("tickets/createticketembed:TICKET_CREATED", {
						channel: channel.toString(),
					}, { ephemeral: true });

					await channel.send(`<@${interaction.user.id}>`);

					const embed = new EmbedBuilder()
						.setTitle("Support Ticket")
						.setAuthor({ name: interaction.user.getUsername(), iconURL: interaction.user.displayAvatarURL() })
						.setDescription(interaction.translate("tickets/createticketembed:TICKET_CREATED_DESC"))
						.setColor(client.config.embed.color)
						.setFooter(client.config.embed.footer)
						.setTimestamp();

					const closeButton = new ButtonBuilder()
						.setCustomId("close_ticket")
						.setLabel(interaction.translate("tickets/closeticket:CLOSE_TICKET"))
						.setStyle(ButtonStyle.Danger);
					const transcriptButton = new ButtonBuilder()
						.setCustomId("transcript_ticket")
						.setLabel(interaction.translate("tickets/closeticket:TRANSCRIPT_TICKET"))
						.setStyle(ButtonStyle.Secondary);
					const row = new ActionRowBuilder().addComponents(closeButton, transcriptButton);

					await channel.send({ embeds: [embed], components: [row] });
				}

				if (button.customId === "close_ticket") {
					const embed = new EmbedBuilder()
						.setTitle(interaction.translate("tickets/closeticket:CLOSING_TITLE"))
						.setDescription(interaction.translate("tickets/closeticket:CLOSING_DESC"))
						.addFields(
							{
								name: interaction.translate("common:TICKET"),
								value: interaction.channel.name,
							},
							{
								name: interaction.translate("tickets/closeticket:CLOSING_BY"),
								value: interaction.user.getUsername(),
							},
						)
						.setColor(client.config.embed.color)
						.setFooter(client.config.embed.footer)
						.setTimestamp();

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
							const reversedMessages = (await interaction.channel.messages.fetch()).filter(m => !m.author.bot);
							const messages = Array.from(reversedMessages.values()).reverse();

							let transcript = "---- TICKET CREATED ----\n";
							messages.forEach(message => {
								transcript += `[${client.functions.printDate(client, message.createdTimestamp, null, interaction.guild.data.language)}] ${message.author.getUsername()}: ${message.content}\n`;
							});
							transcript += "---- TICKET CLOSED ----";

							interaction.guild.channels.cache.get(transcriptionLogs).send({ content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: `<#${interaction.channelId}>` }), files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });

							const logChannel = interaction.guild.channels.cache.get(ticketLogs);
							const logEmbed = new EmbedBuilder()
								.setTitle(interaction.translate("tickets/createticketembed:TICKET_CLOSED_TITLE"))
								.setDescription(`${interaction.user.toString()} (${interaction.channel.toString()})`)
								.setColor(client.config.embed.color)
								.setFooter(client.config.embed.footer)
								.setTimestamp();

							logChannel.send({ embeds: [logEmbed] });

							interaction.channel.send("Closed!");

							try {
								await interaction.user.send({
									content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: interaction.channel.name }),
									files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }],
								});
							} catch (e) {
								await interaction.reply({ content: interaction.translate("misc:CANT_DM"), ephemeral: true });
							}

							await interaction.channel.permissionOverwrites.edit(interaction.member, { ViewChannel: false, SendMessages: null });
							await interaction.channel.setName(`${interaction.channel.name}-closed`);
						}
					});
				}

				if (button.customId === "transcript_ticket") {
					await interaction.deferUpdate();

					const reversedMessages = (await interaction.channel.messages.fetch()).filter(m => !m.author.bot);
					const messages = Array.from(reversedMessages.values()).reverse();

					let transcript = "---- TICKET CREATED ----\n";
					messages.forEach(message => {
						transcript += `[${client.functions.printDate(client, message.createdTimestamp, null, interaction.guild.data.language)}] ${message.author.getUsername()}: ${message.content}\n`;
					});
					transcript += "---- TICKET CLOSED ----";

					try {
						await interaction.user.send({
							content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: `<#${interaction.channelId}>` }),
							files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }],
						});
					} catch (error) {
						await interaction.followUp({ content: interaction.translate("misc:CANT_DM"), ephemeral: true });
					}
				}
			}
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		if (!data.guildData.plugins.tickets.ticketsCategory) return interaction.error("tickets/createticketembed:NO_CATEGORY");

		await interaction.deferReply({ ephemeral: true });

		const embed = new EmbedBuilder()
			.setTitle(interaction.translate("tickets/createticketembed:TICKET_TITLE"))
			.setDescription(interaction.translate("tickets/createticketembed:TICKET_DESC"))
			.setColor(client.config.embed.color)
			.setFooter(client.config.embed.footer);

		const supportButton = new ButtonBuilder().setCustomId("support_ticket").setLabel(interaction.translate("tickets/createticketembed:TICKET_SUPPORT")).setStyle(ButtonStyle.Primary);
		const row = new ActionRowBuilder().addComponents(supportButton);

		await interaction.channel.send({ embeds: [embed], components: [row] });

		interaction.success("tickets/createticketembed:SUCCESS", null, { edit: true });
	}
}

module.exports = CreateTicketEmbed;
