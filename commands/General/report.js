const { SlashCommandBuilder, EmbedBuilder, parseEmoji } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Report extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("report")
				.setDescription(client.translate("general/report:DESCRIPTION"))
				.setDescriptionLocalizations({ "uk": client.translate("general/report:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(false)
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))
					.setDescriptionLocalizations({ "uk": client.translate("common:USER", null, "uk-UA") })
					.setRequired(true))
				.addStringOption(option => option.setName("message")
					.setDescription(client.translate("common:MESSAGE"))
					.setDescriptionLocalizations({ "uk": client.translate("common:MESSAGE", null, "uk-UA") })
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
		const repChannel = interaction.guild.channels.cache.get(interaction.guild.data.plugins.reports);
		if (!repChannel) return interaction.error("general/report:MISSING_CHANNEL");
		const member = interaction.options.getMember("user");
		if (member.id === interaction.user.id) return interaction.error("general/report:INVALID_USER");
		const rep = interaction.options.getString("message");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("general/report:TITLE", {
					user: member.user.tag,
				}),
				iconURL: interaction.user.displayAvatarURL({
					extension: "png",
					size: 512,
				}),
			})
			.addFields([
				{
					name: interaction.translate("common:DATE"),
					value: client.functions.printDate(client, new Date(Date.now())),
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
			])
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer,
			});

		const success = parseEmoji(client.customEmojis.cool).id;
		const error = parseEmoji(client.customEmojis.notcool).id;

		repChannel.send({
			embeds: [embed],
		}).then(async m => {
			await m.react(success);
			await m.react(error);
		});

		interaction.success("general/report:SUCCESS", {
			channel: repChannel.toString(),
		}, { ephemeral: true });
	}
}

module.exports = Report;