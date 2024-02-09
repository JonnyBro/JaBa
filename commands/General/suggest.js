const { SlashCommandBuilder, parseEmoji } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Suggest extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("suggest")
				.setDescription(client.translate("general/suggest:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/suggest:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/suggest:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
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
			channel = interaction.guild.channels.cache.get(guildData.plugins.suggestions);
		if (!channel) return interaction.error("general/suggest:MISSING_CHANNEL");

		const suggestion = interaction.options.getString("message");

		const embed = client.embed({
			author: {
				name: interaction.translate("general/suggest:TITLE", {
					user: interaction.user.getUsername(),
				}),
				iconURL: interaction.member.displayAvatarURL(),
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
					name: interaction.translate("common:CONTENT"),
					value: suggestion,
					inline: true,
				},
			],
		});

		const success = parseEmoji(client.customEmojis.cool).id;
		const error = parseEmoji(client.customEmojis.notcool).id;

		channel.send({
			embeds: [embed],
		}).then(async m => {
			await m.react(success);
			await m.react(error);
		});

		interaction.success("general/suggest:SUCCESS", {
			channel: channel.toString(),
		}, { ephemeral: true });
	}
}

module.exports = Suggest;
