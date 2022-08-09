const { SlashCommandBuilder } = require("discord.js"),
	Mee6Api = require("../../helpers/mee6-api");
const BaseCommand = require("../../base/BaseCommand");

class ImportMee6 extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("importmee6")
				.setDescription(client.translate("economy/importmee6:DESCRIPTION")),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: false
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
		await interaction.deferReply();
		const level = (await Mee6Api.getUserXp(interaction.guildId, interaction.member)).level;

		data.memberData.level = level;
		await data.memberData.save();

		interaction.editReply({
			content: interaction.translate("owner/debug:SUCCESS_LEVEL", {
				username: interaction.member.toString(),
				amount: level
			})
		});
	}
}

module.exports = ImportMee6;