const { SlashCommandBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class CreateTicketEmbed extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
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
		const guildData = interaction.data.guild;

		if (!guildData.plugins.tickets.ticketsCategory) return interaction.error("tickets/createticketembed:NO_CATEGORY");

		await interaction.deferReply({ ephemeral: true });

		const embed = client.embed({
			title: interaction.translate("tickets/createticketembed:TICKET_TITLE"),
			description: interaction.translate("tickets/createticketembed:TICKET_DESC"),
		});

		const supportButton = new ButtonBuilder().setCustomId("support_ticket").setLabel(interaction.translate("tickets/createticketembed:TICKET_SUPPORT")).setStyle(ButtonStyle.Primary);
		const row = new ActionRowBuilder().addComponents(supportButton);

		await interaction.channel.send({ embeds: [embed], components: [row] });

		interaction.success("tickets/createticketembed:SUCCESS", null, { edit: true });
	}
}

module.exports = CreateTicketEmbed;
