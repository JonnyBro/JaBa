const { SlashCommandBuilder, parseEmoji, PermissionsBitField, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Stealemoji extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("stealemoji")
				.setDescription(client.translate("administration/stealemoji:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("administration/stealemoji:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("administration/stealemoji:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addStringOption(option =>
					option
						.setName("emoji")
						.setDescription(client.translate("common:EMOJI"))
						.setDescriptionLocalizations({
							uk: client.translate("common:EMOJI", null, "uk-UA"),
							ru: client.translate("common:EMOJI", null, "ru-RU"),
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
		const parsedEmoji = parseEmoji(interaction.options.getString("emoji"));

		interaction.guild.emojis
			.create({
				name: parsedEmoji.name,
				attachment: `https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${parsedEmoji.animated ? "gif" : "png"}`,
			})
			.then(emoji =>
				interaction.success("administration/stealemoji:SUCCESS", {
					emoji: emoji.toString(),
				}, { ephemeral: true }),
			)
			.catch(e => {
				interaction.error("administration/stealemoji:ERROR", {
					emoji: parsedEmoji.name,
					e,
				}, { ephemeral: true });
			});
	}
}

module.exports = Stealemoji;
