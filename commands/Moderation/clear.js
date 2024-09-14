const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, InteractionContextType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Clear extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("clear")
				.setDescription(client.translate("moderation/clear:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("moderation/clear:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("moderation/clear:DESCRIPTION", null, "ru-RU"),
				})
				.setContexts([InteractionContextType.Guild])
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
				.addStringOption(option =>
					option
						.setName("option")
						.setDescription(client.translate("moderation/clear:OPTION"))
						.setDescriptionLocalizations({
							uk: client.translate("moderation/clear:OPTION", null, "uk-UA"),
							ru: client.translate("moderation/clear:OPTION", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
						}),
				)
				.addStringOption(option =>
					option
						.setName("id")
						.setDescription(client.translate("common:USER_ID"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER_ID", null, "uk-UA"),
							ru: client.translate("common:USER_ID", null, "ru-RU"),
						}),
				),
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
		await interaction.deferReply({ ephemeral: true });

		const option = interaction.options.getString("option"),
			member = interaction.options.getMember("user"),
			user_id = interaction.options.getString("id");

		if (option === "all") {
			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("clear_confirm_yes").setLabel(interaction.translate("common:ACCEPT")).setStyle(ButtonStyle.Danger),
				new ButtonBuilder().setCustomId("clear_confirm_no").setLabel(interaction.translate("common:CANCEL")).setStyle(ButtonStyle.Secondary),
			);

			await interaction.editReply({
				content: interaction.translate("moderation/clear:ALL_CONFIRM"),
				components: [row],
			});

			const filter = i => i.user.id === interaction.user.id;
			const collector = interaction.channel.createMessageComponentCollector({ filter, idle: 15 * 1000 });

			collector.on("collect", async i => {
				if (i.isButton()) {
					if (i.customId === "clear_confirm_yes") {
						i.deferUpdate();

						const position = interaction.channel.position;
						const newChannel = await interaction.channel.clone();
						await interaction.channel.delete();
						newChannel.setPosition(position);

						return newChannel.send({
							content: interaction.translate("moderation/clear:CHANNEL_CLEARED"),
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
						components: [row],
					});
				} else if (reason === "idle") {
					row.components.forEach(component => {
						component.setDisabled(true);
					});

					interaction.editReply({
						components: [row],
					});
				}
			});
		} else {
			if (isNaN(option) || parseInt(option) < 1) return interaction.error("misc:OPTION_NAN_ALL", null, { ephemeral: true });

			let messages = await interaction.channel.messages.fetch({ limit: option });

			if (user_id && member) return interaction.replyT("moderation/clear:REQUIRE_ID_USER", null, { edit: true });
			if (user_id || member) messages = messages.filter(m => m.author.id === (user_id || member.id));

			interaction.channel.bulkDelete(messages.filter(m => !m.pinned), true);

			if (member || user_id) {
				interaction.replyT("moderation/clear:CLEARED_MEMBER", {
					amount: `**${option}** ${client.functions.getNoun(option, interaction.translate("misc:NOUNS:MESSAGES:1"), interaction.translate("misc:NOUNS:MESSAGES:2"), interaction.translate("misc:NOUNS:MESSAGES:5"))}`,
					user: user_id || member.toString(),
				}, { edit: true });
			} else {
				interaction.replyT("moderation/clear:CLEARED", {
					amount: `**${option}** ${client.functions.getNoun(option, interaction.translate("misc:NOUNS:MESSAGES:1"), interaction.translate("misc:NOUNS:MESSAGES:2"), interaction.translate("misc:NOUNS:MESSAGES:5"))}`,
				}, { edit: true });
			}
		}
	}
}

module.exports = Clear;
