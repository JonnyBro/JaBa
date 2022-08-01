const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Eightball extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("8ball")
				.setDescription(client.translate("fun/8ball:DESCRIPTION"))
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
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();
		const question = interaction.options.getString("question");

		if (!question.endsWith("?")) return interaction.replyT("fun/8ball:ERR_QUESTION", null, { ephemeral: true });

		const answerN = client.functions.randomNum(1, 20);
		const answer = interaction.translate(`fun/8ball:RESPONSE_${answerN}`);
		await client.wait(2000);

		interaction.editReply({
			content: answer
		});
	}
}

module.exports = Eightball;