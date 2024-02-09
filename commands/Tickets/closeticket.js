const { SlashCommandBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class CloseTicket extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
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
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const guildData = interaction.data.guild;

		if (!interaction.channel.name.includes("support")) return interaction.error("tickets/adduser:NOT_TICKET", null, { ephemeral: true, edit: true });

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

		await interaction.editReply({
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
				const transcriptionLogs = guildData.plugins.tickets.transcriptionLogs,
					ticketLogs = guildData.plugins.tickets.ticketLogs;
				const reversedMessages = (await interaction.channel.messages.fetch()).filter(m => !m.author.bot);
				const messages = Array.from(reversedMessages.values()).reverse();

				let transcript = "---- TICKET CREATED ----\n";
				messages.forEach(message => {
					transcript += `[${client.functions.printDate(client, message.createdTimestamp, null, interaction.getLocale())}] ${message.author.getUsername()}: ${message.content}\n`;
				});
				transcript += "---- TICKET CLOSED ----";

				if (transcriptionLogs) interaction.guild.channels.cache.get(transcriptionLogs).send({ content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: `<#${interaction.channelId}>` }), files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });

				if (ticketLogs) {
					const logChannel = interaction.guild.channels.cache.get(ticketLogs);
					const logEmbed = client.embed({
						title: interaction.translate("tickets/createticketembed:TICKET_CLOSED_TITLE"),
						description: `${interaction.user.toString()} (${interaction.channel.toString()})`,
					});

					logChannel.send({ embeds: [logEmbed] });
				}

				interaction.channel.send("Closed!");

				try {
					await interaction.user.send({
						content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: interaction.channel.name }),
						files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }],
					});
				} catch (e) {
					interaction.reply({ content: interaction.translate("misc:CANT_DM"), ephemeral: true });
				}

				const member = interaction.guild.members.cache.find(u => u.user.id === interaction.channel.topic);
				await interaction.channel.permissionOverwrites.edit(member, { ViewChannel: false, SendMessages: null });
				await interaction.channel.setName(`${interaction.channel.name}-closed`);
			}
		});

		const ticketLogs = guildData.plugins.tickets.ticketLogs;
		const logEmbed = client.embed({
			title: interaction.translate("tickets/closeticket:CLOSED_TITLE"),
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

		if (ticketLogs) interaction.guild.channels.cache.get(ticketLogs).send({ embeds: [logEmbed] });
	}
}

module.exports = CloseTicket;
