const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class CloseTicket extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("closeticket")
				.setDescription(client.translate("tickets/closeticket:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("tickets/closeticket:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("tickets/closeticket:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		await interaction.deferReply();

		if (!interaction.channel.name.includes("support")) return interaction.error("tickets/adduser:NOT_TICKET", null, { ephemeral: true, edit: true });

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
				const transcriptionLogs = data.guildData.plugins.tickets.transcriptionLogs,
					ticketLogs = data.guildData.plugins.tickets.ticketLogs;
				const reversedMessages = (await interaction.channel.messages.fetch()).filter(m => !m.author.bot);
				const messages = Array.from(reversedMessages.values()).reverse();

				let transcript = "---- TICKET CREATED ----\n";
				messages.forEach(message => {
					transcript += `[${client.functions.printDate(client, message.createdTimestamp, null, data.guildData.language)}] ${message.author.getUsername()}: ${message.content}\n`;
				});
				transcript += "---- TICKET CLOSED ----";

				if (transcriptionLogs) interaction.guild.channels.cache.get(transcriptionLogs).send({ content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: `<#${interaction.channelId}>` }), files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });

				if (ticketLogs) {
					const logChannel = interaction.guild.channels.cache.get(ticketLogs);
					const logEmbed = new EmbedBuilder()
						.setTitle(interaction.translate("tickets/createticketembed:TICKET_CLOSED_TITLE"))
						.setDescription(`${interaction.user.toString()} (${interaction.channel.toString()})`)
						.setColor(client.config.embed.color)
						.setFooter(client.config.embed.footer)
						.setTimestamp();

					logChannel.send({ embeds: [logEmbed] });
				}

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

		const ticketLogs = data.guildData.plugins.tickets.ticketLogs;
		const logEmbed = new EmbedBuilder()
			.setTitle(interaction.translate("tickets/closeticket:CLOSED_TITLE"))
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

		if (ticketLogs) interaction.guild.channels.cache.get(ticketLogs).send({ embeds: [logEmbed] });
	}
}

module.exports = CloseTicket;
