const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Avatar extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("avatar")
				.setDescription(client.translate("general/avatar:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/avatar:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/avatar:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true)
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
						}),
				)
				.addBooleanOption(option =>
					option
						.setName("server")
						.setDescription(client.translate("general/avatar:SERVER"))
						.setDescriptionLocalizations({
							uk: client.translate("general/avatar:SERVER", null, "uk-UA"),
							ru: client.translate("general/avatar:SERVER", null, "ru-RU"),
						}),
				),
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
		const member = interaction.options.getMember("user") || interaction.member;
		const avatarURL = interaction.options.getBoolean("server") ? member.avatarURL({ size: 512 }) : member.user.avatarURL({ size: 512 });

		interaction.reply({
			files: [
				{
					attachment: avatarURL,
				},
			],
		});
	}
}

module.exports = Avatar;
