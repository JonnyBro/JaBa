const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
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
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("question")
						.setDescription(client.translate("fun/8ball:QUESTION"))
						.setDescriptionLocalizations({
							uk: client.translate("fun/8ball:QUESTION", null, "uk-UA"),
							ru: client.translate("fun/8ball:QUESTION", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addBooleanOption(option =>
					option
						.setName("ephemeral")
						.setDescription(client.translate("misc:EPHEMERAL_RESPONSE"))
						.setDescriptionLocalizations({
							uk: client.translate("misc:EPHEMERAL_RESPONSE", null, "uk-UA"),
							ru: client.translate("misc:EPHEMERAL_RESPONSE", null, "ru-RU"),
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
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral") || false });

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
