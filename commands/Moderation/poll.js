const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, parseEmoji } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Poll extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("poll")
				.setDescription(client.translate("moderation/poll:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("moderation/poll:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("moderation/poll:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
				.addStringOption(option =>
					option
						.setName("question")
						.setDescription(client.translate("moderation/poll:QUESTION"))
						.setDescriptionLocalizations({
							uk: client.translate("moderation/poll:QUESTION", null, "uk-UA"),
							ru: client.translate("moderation/poll:QUESTION", null, "ru-RU"),
						})
						.setRequired(true),
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
		const question = interaction.options.getString("question");

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("poll_everyone").setLabel("@everyone").setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId("poll_here").setLabel("@here").setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId("poll_nothing").setLabel(interaction.translate("moderation/poll:NOTHING")).setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId("poll_cancel").setLabel(interaction.translate("common:CANCEL")).setStyle(ButtonStyle.Danger),
		);

		await interaction.reply({
			content: interaction.translate("moderation/poll:SELECT_MENTION"),
			ephemeral: true,
			components: [row],
		});

		let mention = null;
		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, idle: 15 * 1000 });

		collector.on("collect", async i => {
			if (i.isButton()) {
				if (i.customId === "poll_everyone") {
					mention = "||@everyone||";
					i.update({
						content: interaction.translate("moderation/poll:POLL_SENDED"),
						components: [],
					});
				} else if (i.customId === "poll_here") {
					mention = "||@here||";
					i.update({
						content: interaction.translate("moderation/poll:POLL_SENDED"),
						components: [],
					});
				} else if (i.customId === "poll_nothing") {
					mention = null;
					i.update({
						content: interaction.translate("moderation/poll:POLL_SENDED"),
						components: [],
					});
				} else if (i.customId === "poll_cancel") {
					return i.update({
						content: interaction.translate("misc:SELECT_CANCELED"),
						components: [],
					});
				}

				const cool = parseEmoji(client.customEmojis.cool).id;
				const notcool = parseEmoji(client.customEmojis.notcool).id;

				const embed = client.embed({
					author: interaction.translate("moderation/poll:TITLE"),
					fields: [
						{
							name: "\u200B",
							value: question,
						},
						{
							name: "\u200B",
							value: interaction.translate("moderation/poll:REACT", {
								success: cool.toString(),
								error: notcool.toString(),
							}),
						},
					],
				});

				return interaction.channel.send({
					content: mention,
					embeds: [embed],
				}).then(async m => {
					await m.react(cool);
					await m.react(notcool);
				});
			}
		});
	}
}

module.exports = Poll;
