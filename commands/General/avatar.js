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
				.setDescriptionLocalizations({ "uk": client.translate("general/avatar:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(true)
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))
					.setDescriptionLocalizations({ "uk": client.translate("common:USER", null, "uk-UA") })),
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
		const user = interaction.options.getUser("user") || interaction.user;
		const avatarURL = user.displayAvatarURL({
			size: 512,
		});

		interaction.reply({
			files: [{
				attachment: avatarURL,
			}],
		});
	}
}

module.exports = Avatar;