const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Poll extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("poll")
				.setDescription(client.translate("moderation/poll:DESCRIPTION"))
				.setDescriptionLocalizations({
					"uk": client.translate("moderation/poll:DESCRIPTION", null, "uk-UA"),
					"ru": client.translate("moderation/poll:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers && PermissionFlagsBits.ManageMessages)
				.addStringOption(option => option.setName("question")
					.setDescription(client.translate("moderation/poll:QUESTION"))
					.setDescriptionLocalizations({
						"uk": client.translate("moderation/poll:QUESTION", null, "uk-UA"),
						"ru": client.translate("moderation/poll:QUESTION", null, "ru-RU"),
					})
					.setRequired(true)),
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
	async execute(client, interaction) {
		const question = interaction.options.getString("question");

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("poll_everyone")
					.setLabel("@everyone")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("poll_here")
					.setLabel("@here")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("poll_nothing")
					.setLabel(interaction.translate("moderation/poll:NOTHING"))
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId("poll_cancel")
					.setLabel(interaction.translate("common:CANCEL"))
					.setStyle(ButtonStyle.Danger),
			);


		await interaction.reply({
			content: interaction.translate("moderation/poll:SELECT_MENTION"),
			ephemeral: true,
			components: [row],
		});

		let mention = null;
		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (15 * 1000) });

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

				const cool = client.emojis.cache.find(e => e.name === client.customEmojis.cool.split(":")[1]);
				const notcool = client.emojis.cache.find(e => e.name === client.customEmojis.notcool.split(":")[1]);

				const embed = new EmbedBuilder()
					.setAuthor({
						name: interaction.translate("moderation/poll:TITLE"),
					})
					.setColor(client.config.embed.color)
					.addFields([
						{
							name: "\u200b",
							value: question,
						},
						{
							name: "\u200b",
							value: interaction.translate("moderation/poll:REACT", {
								success: cool.toString(),
								error: notcool.toString(),
							}),
						},
					]);

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