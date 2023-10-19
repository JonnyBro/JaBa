const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Afk extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("afk")
				.setDescription(client.translate("general/afk:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/afk:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/afk:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true)
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
		interaction.deferReply({ ephemeral: true });

		const reason = interaction.options.getString("message");

		data.userData.afk = reason;

		await data.userData.save();

		interaction.success("general/afk:SUCCESS", {
			reason,
		}, { edit: true });
	}
}

module.exports = Afk;
