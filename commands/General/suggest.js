const { SlashCommandBuilder, EmbedBuilder, parseEmoji } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Suggest extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("suggest")
				.setDescription(client.translate("general/suggest:DESCRIPTION"))
				.setDescriptionLocalizations({
					"uk": client.translate("general/suggest:DESCRIPTION", null, "uk-UA"),
					"ru": client.translate("general/suggest:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addStringOption(option => option.setName("message")
					.setDescription(client.translate("common:MESSAGE"))
					.setDescriptionLocalizations({
						"uk": client.translate("common:MESSAGE", null, "uk-UA"),
						"ru": client.translate("common:MESSAGE", null, "ru-RU"),
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
	async execute(client, interaction, data) {
		const suggChannel = interaction.guild.channels.cache.get(data.guildData.plugins.suggestions);
		if (!suggChannel) return interaction.error("general/suggest:MISSING_CHANNEL");

		const suggestion = interaction.options.getString("message");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("general/suggest:TITLE", {
					user: interaction.user.discriminator === "0" ? interaction.user.username : interaction.user.tag,
				}),
				iconURL: interaction.member.displayAvatarURL(),
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
					name: interaction.translate("common:CONTENT"),
					value: suggestion,
					inline: true,
				},
			])
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer,
			});

		const success = parseEmoji(client.customEmojis.cool).id;
		const error = parseEmoji(client.customEmojis.notcool).id;

		suggChannel.send({
			embeds: [embed],
		}).then(async m => {
			await m.react(success);
			await m.react(error);
		});

		interaction.success("general/suggest:SUCCESS", {
			channel: suggChannel.toString(),
		}, { ephemeral: true });
	}
}

module.exports = Suggest;