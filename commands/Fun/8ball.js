const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Eightball extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("8ball")
				.setDescription(client.translate("fun/8ball:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("fun/8ball:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("fun/8ball:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true)
				.addStringOption(option =>
					option
						.setName("question")
						.setDescription(client.translate("fun/8ball:QUESTION"))
						.setDescriptionLocalizations({
							uk: client.translate("fun/8ball:QUESTION", null, "uk-UA"),
							ru: client.translate("fun/8ball:QUESTION", null, "ru-RU"),
						})
						.setRequired(true),
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
		await interaction.deferReply();

		const question = interaction.options.getString("question");
		const embed = client.embed({
			fields: [
				{
					name: interaction.translate("fun/8ball:QUESTION"),
					value: question,
				},
				{
					name: interaction.translate("fun/8ball:ANSWER"),
					value: interaction.translate(`fun/8ball:RESPONSE_${client.functions.randomNum(1, 20)}`),
				},
			],
		});

		await client.wait(5000);

		interaction.editReply({ embeds: [embed] });
	}
}

module.exports = Eightball;
