const { SlashCommandBuilder, parseEmoji, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Report extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("report")
				.setDescription(client.translate("general/report:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/report:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/report:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName("message")
						.setDescription(client.translate("common:MESSAGE"))
						.setDescriptionLocalizations({
							uk: client.translate("common:MESSAGE", null, "uk-UA"),
							ru: client.translate("common:MESSAGE", null, "ru-RU"),
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
		const guildData = interaction.data.guild,
			repChannel = interaction.guild.channels.cache.get(guildData.plugins.reports);
		if (!repChannel) return interaction.error("general/report:MISSING_CHANNEL");

		const member = interaction.options.getMember("user");
		if (member.id === interaction.user.id) return interaction.error("general/report:INVALID_USER");

		const rep = interaction.options.getString("message");

		const embed = client.embed({
			author: {
				name: interaction.translate("general/report:TITLE", {
					user: member.user.getUsername(),
				}),
				iconURL: interaction.user.displayAvatarURL(),
			},
			fields: [
				{
					name: interaction.translate("common:DATE"),
					value: `<t:${Math.floor(Date.now() / 1000)}:D>`,
				},
				{
					name: interaction.translate("common:AUTHOR"),
					value: interaction.user.toString(),
					inline: true,
				},
				{
					name: interaction.translate("common:USER"),
					value: member.user.toString(),
					inline: true,
				},
				{
					name: interaction.translate("common:REASON"),
					value: rep,
					inline: true,
				},
			],
		});

		const cool = parseEmoji(client.customEmojis.cool).id;
		const notcool = parseEmoji(client.customEmojis.notcool).id;

		repChannel.send({
			embeds: [embed],
		}).then(async m => {
			await m.react(cool);
			await m.react(notcool);
		});

		interaction.success("general/report:SUCCESS", {
			channel: repChannel.toString(),
		}, { ephemeral: true });
	}
}

module.exports = Report;
