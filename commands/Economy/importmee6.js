const { SlashCommandBuilder } = require("discord.js"),
	{ getUserXp } = require("mee6-levels-api");
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
		const level = (await getUserXp(interaction.guildId, interaction.member.id)).level;

		data.memberData.level = level;
		await data.memberData.save();

		interaction.success("owner/debug:SUCCESS_LEVEL", {
			username: interaction.member.toString(),
			amount: level
		});
	}
}

module.exports = ImportMee6;