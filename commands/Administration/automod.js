const { SlashCommandBuilder, PermissionsBitField, ChannelType, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Automod extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("automod")
				.setDescription(client.translate("administration/automod:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("administration/automod:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("administration/automod:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addSubcommand(subcommand =>
					subcommand
						.setName("toggle")
						.setDescription(client.translate("administration/automod:TOGGLE"))
						.setDescriptionLocalizations({
							uk: client.translate("administration/automod:TOGGLE", null, "uk-UA"),
							ru: client.translate("administration/automod:TOGGLE", null, "ru-RU"),
						})
						.addBooleanOption(option =>
							option
								.setName("state")
								.setDescription(client.translate("common:STATE"))
								.setDescriptionLocalizations({
									uk: client.translate("common:STATE", null, "uk-UA"),
									ru: client.translate("common:STATE", null, "ru-RU"),
								})
								.setRequired(true),
						),
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName("ignore")
						.setDescription(client.translate("administration/automod:IGNORE"))
						.setDescriptionLocalizations({
							uk: client.translate("administration/automod:IGNORE", null, "uk-UA"),
							ru: client.translate("administration/automod:IGNORE", null, "ru-RU"),
						})
						.addChannelOption(option =>
							option
								.setName("channel")
								.setDescription(client.translate("common:CHANNEL"))
								.setDescriptionLocalizations({
									uk: client.translate("common:CHANNEL", null, "uk-UA"),
									ru: client.translate("common:CHANNEL", null, "ru-RU"),
								})
								.addChannelTypes(ChannelType.GuildText)
								.setRequired(true),
						),
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
		const { data } = interaction,
			state = interaction.options.getBoolean("state"),
			channel = interaction.options.getChannel("channel"),
			command = interaction.options.getSubcommand();

		if (command === "toggle") {
			data.guild.plugins.automod = {
				enabled: state,
				ignored: [],
			};

			await data.guild.save();

			interaction.success(`administration/automod:${state ? "ENABLED" : "DISABLED"}`);
		} else if (command === "ignore") {
			data.guild.plugins.automod.ignored.push(channel.id);

			await data.guild.save();

			interaction.success("administration/automod:DISABLED_CHANNEL", {
				channel: channel.toString(),
			});
		}
	}
}

module.exports = Automod;
