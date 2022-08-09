const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class LMGTFY extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("lmgtfy")
				.setDescription(client.translate("fun/lmgtfy:DESCRIPTION"))
				.addStringOption(option =>
					option.setName("question")
						.setDescription(client.translate("fun/8ball:QUESTION"))
						.setRequired(true)),
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
	async execute(client, interaction) {
		const question = interaction.options.getString("question").replace(/[' '_]/g, "+");

		interaction.reply({
			content: `<https://letmegooglethat.com/?q=${question}>`,
			ephemeral: true
		});
	}
}

module.exports = LMGTFY;