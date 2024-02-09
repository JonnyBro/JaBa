const { SlashCommandBuilder } = require("discord.js"),
	Mee6Api = require("../../helpers/mee6-api");
const BaseCommand = require("../../base/BaseCommand");

class ImportMee6 extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("importmee6")
				.setDescription(client.translate("economy/importmee6:DESCRIPTION"))
				.setDescriptionLocalizations({ uk: client.translate("economy/importmee6:DESCRIPTION", null, "uk-UA"), ru: client.translate("economy/importmee6:DESCRIPTION", null, "ru-RU") })
				.setDMPermission(false),
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
		await interaction.deferReply();

		const level = (await Mee6Api.getUserXp(interaction.guildId, interaction.member)).level;

		interaction.data.member.level = level;
		interaction.data.member.exp = 0;

		interaction.data.member.markModified("level");
		interaction.data.member.markModified("exp");
		await interaction.data.member.save();

		interaction.editReply({
			content: interaction.translate("owner/debug:SUCCESS_LEVEL", {
				user: interaction.member.toString(),
				amount: level,
			}),
		});
	}
}

module.exports = ImportMee6;
