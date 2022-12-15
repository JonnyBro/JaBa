const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Setbio extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("setbio")
				.setDescription(client.translate("economy/setbio:DESCRIPTION"))
				.setDMPermission(true)
				.addStringOption(option => option.setName("text")
					.setDescription(client.translate("economy/profile:BIO"))
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
		const newBio = interaction.options.getString("text");
		if (newBio.length > 150) return interaction.error("economy/setbio:MAX_CHARACTERS");

		data.userData.bio = newBio;
		await data.userData.save();
		interaction.success("economy/setbio:SUCCESS");
	}
}

module.exports = Setbio;