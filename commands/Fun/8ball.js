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
				.setDMPermission(true)
				.addStringOption(option => option.setName("question")
					.setDescription(client.translate("fun/8ball:QUESTION"))
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
	async execute(client, interaction) {
		await interaction.deferReply();

		const question = interaction.options.getString("question");
		const answer = interaction.translate(`fun/8ball:RESPONSE_${client.functions.randomNum(1, 20)}`);
		await client.wait(5000);

		interaction.replyT("fun/8ball:ANSWER", {
			question,
			answer,
		}, { edit: true });
	}
}

module.exports = Eightball;