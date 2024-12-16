const { SlashCommandBuilder, parseEmoji, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Emoji extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("emoji")
				.setDescription(client.translate("general/emoji:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/emoji:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/emoji:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("emoji")
						.setDescription(client.translate("common:EMOJI"))
						.setDescriptionLocalizations({
							uk: client.translate("commom:EMOJI", null, "uk-UA"),
							ru: client.translate("common:EMOJI", null, "ru-RU"),
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

		const rawEmoji = interaction.options.getString("emoji");
		const parsedEmoji = parseEmoji(rawEmoji);
		const embed = client.embed({
			author: {
				name: interaction.translate("general/emoji:TITLE", {
					emoji: parsedEmoji.name,
				}),
			},
			fields: [
				{
					name: interaction.translate("common:NAME"),
					value: parsedEmoji.name,
				},
				{
					name: interaction.translate("general/emoji:ANIMATED"),
					value: parsedEmoji.animated ? interaction.translate("common:YES") : interaction.translate("common:NO"),
				},
				{
					name: interaction.translate("common:ID"),
					value: parsedEmoji.id?.toString() || interaction.translate("general/emoji:STANDART"),
				},
				{
					name: interaction.translate("general/emoji:LINK"),
					value: `https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${parsedEmoji.animated ? "gif" : "png"}`,
				},
			],
		});

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Emoji;
