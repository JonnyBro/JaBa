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

		if (!interaction.channel.name.includes("support") && !interaction.channel.name.includes("application")) return interaction.error("tickets/adduser:NOT_TICKET", null, { ephemeral: true, edit: true });

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
					value: interaction.user.getUsetname(),
				},
			)
			.setColor(client.config.embed.color)
			.setFooter(client.config.embed.footer)
			.setTimestamp();

		const button = new ButtonBuilder().setCustomId("cancel").setLabel(interaction.translate("common:CANCEL")).setStyle(ButtonStyle.Danger);
		const row = new ActionRowBuilder().addComponents(button);

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});

		const filter = i => i.customId === "cancel";
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 5000 });

		collector.on("collect", async i => {
			await i.update({ content: interaction.translate("tickets/closeticket:CLOSING_CANCELED"), components: [] });
			collector.stop("canceled");
		});

		collector.on("end", async (_, reason) => {
			if (reason === "canceled") {
				const transcriptionLogs = data.guildData.plugins.tickets.transcriptionLogs;
				if (transcriptionLogs) interaction.guild.channels.cache.get(transcriptionLogs).send({ content: interaction.translate("tickets/closeticket:TRANSCRIPT", { channel: `<#${transcriptionLogs}>` }), files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });
				const reversedMessages = await interaction.channel.messages.fetch();

				const messages = Array.from(reversedMessages.values()).reverse();

				let transcript = "";
				messages.forEach(message => {
					transcript += `${message.author.username}: ${message.content}\n`;
				});

				try {
					await interaction.user.send({ content: `Here is the transcript for your ticket: ${interaction.channel.name}`, files: [{ attachment: Buffer.from(transcript), name: `${interaction.channel.name}.txt` }] });
				} catch (error) {
					console.error(error);
					await interaction.reply("An error occurred while trying to send the transcript to the user.");
				}

				await interaction.channel.delete();
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
					value: interaction.user.getUsetname(),
				},
			)
			.setColor(client.config.embed.color)
			.setFooter(client.config.embed.footer)
			.setTimestamp();

		if (ticketLogs) interaction.guild.channels.cache.get(ticketLogs).send({ embeds: [logEmbed] });
	}
}

module.exports = CloseTicket;
