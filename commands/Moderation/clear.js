const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Clear extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("clear")
				.setDescription(client.translate("moderation/clear:DESCRIPTION"))
				.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers && PermissionFlagsBits.ManageMessages)
				.addStringOption(option => option.setName("option")
					.setDescription(client.translate("moderation/clear:OPTION"))
					.setRequired(true))
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))),
			aliases: [],
			dirname: __dirname,
			guildOnly: true
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
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const option = interaction.options.getString("option");
		const member = interaction.options.getMember("user");

		if (option === "all") {
			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId("clear_confirm_yes")
						.setLabel(interaction.translate("common:ACCEPT"))
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId("clear_confirm_no")
						.setLabel(interaction.translate("common:CANCEL"))
						.setStyle(ButtonStyle.Secondary),
				);

			await interaction.editReply({
				content: interaction.translate("moderation/clear:ALL_CONFIRM"),
				components: [row]
			});

			const filter = i => i.user.id === interaction.user.id;
			const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (15 * 1000) });

			collector.on("collect", async i => {
				if (i.isButton()) {
					if (i.customId === "clear_confirm_yes") {
						i.deferUpdate();

						const position = interaction.channel.position;
						const newChannel = await interaction.channel.clone();
						await interaction.channel.delete();
						newChannel.setPosition(position);

						return newChannel.send({
							content: interaction.translate("moderation/clear:CHANNEL_CLEARED")
						});
					} else if (i.customId === "clear_confirm_no") {
						i.deferUpdate();
						collector.stop("cancel");
					}
				}
			});

			collector.on("end", async (_, reason) => {
				if (reason === "cancel") {
					row.components.forEach(component => {
						component.setDisabled(true);
					});

					interaction.editReply({
						content: interaction.translate("misc:SELECT_CANCELED"),
						components: [row]
					});
				} else if (reason === "idle") {
					row.components.forEach(component => {
						component.setDisabled(true);
					});

					interaction.editReply({
						components: [row]
					});
				}
			});
		} else {
			if (isNaN(option) || parseInt(option) < 1) return interaction.error("misc:OPTION_NAN_ALL", null, { ephemeral: true });
			let messages = await interaction.channel.messages.fetch({
				limit: option
			});
			if (member) messages = messages.filter(m => m.author.id === member.id);
			if (messages.length > option) messages.length = parseInt(option, 10);

			interaction.channel.bulkDelete(messages.filter(m => !m.pinned), true);

			if (member) {
				interaction.replyT("moderation/clear:CLEARED_MEMBER", {
					amount: `**${option}** ${client.getNoun(option, interaction.translate("misc:NOUNS:MESSAGES:1"), interaction.translate("misc:NOUNS:MESSAGES:2"), interaction.translate("misc:NOUNS:MESSAGES:5"))}`,
					username: member.user.tag
				}, { ephemeral: true });
			} else {
				interaction.replyT("moderation/clear:CLEARED", {
					amount: `**${option}** ${client.getNoun(option, interaction.translate("misc:NOUNS:MESSAGES:1"), interaction.translate("misc:NOUNS:MESSAGES:2"), interaction.translate("misc:NOUNS:MESSAGES:5"))}`
				}, { ephemeral: true });
			}
		}
	}
}

module.exports = Clear;