const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Automod extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
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
				.setDMPermission(false)
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
		const state = interaction.options.getBoolean("state"),
			channel = interaction.options.getChannel("channel"),
			command = interaction.options.getSubcommand();

		if (command === "toggle") {
			data.guildData.plugins.automod = {
				enabled: state,
				ignored: [],
			};

			await data.guildData.save();

			interaction.success(`administration/automod:${state ? "ENABLED" : "DISABLED"}`);
		} else if (command === "ignore") {
			data.guildData.plugins.automod.ignored.push(channel.id);

			await data.guildData.save();

			interaction.success("administration/automod:DISABLED_CHANNEL", {
				channel: channel.toString(),
			});
		}
	}
}

module.exports = Automod;
