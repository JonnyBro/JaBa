const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Avatar extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
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
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
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
		const user = interaction.options.getUser("user") || interaction.user;
		const avatarURL = interaction.options.getBoolean("server") ? user.displayAvatarURL({ size: 2048 }) : user.avatarURL({ size: 2048 });
		const embed = client.embed({ image: avatarURL });

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Avatar;
