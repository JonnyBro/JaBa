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
				.addBooleanOption(option =>
					option
						.setName("state")
						.setDescription(client.translate("common:STATE"))
						.setDescriptionLocalizations({
							uk: client.translate("common:STATE", null, "uk-UA"),
							ru: client.translate("common:STATE", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addChannelOption(option =>
					option
						.setName("channel")
						.setDescription(client.translate("common:CHANNEL"))
						.setDescriptionLocalizations({
							uk: client.translate("common:CHANNEL", null, "uk-UA"),
							ru: client.translate("common:CHANNEL", null, "ru-RU"),
						})
						.addChannelTypes(ChannelType.GuildText),
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
			channel = interaction.options.getChannel("channel");

		if (state) {
			data.guildData.plugins.automod = {
				enabled: true,
				ignored: [],
			};

			data.guildData.markModified("plugins.automod");
			await data.guildData.save();

			return interaction.success("administration/automod:ENABLED");
		} else {
			if (channel) {
				data.guildData.plugins.automod.ignored.push(channel.id);

				data.guildData.markModified("plugins.automod");
				await data.guildData.save();

				interaction.success("administration/automod:DISABLED_CHANNEL", {
					channel: channel.toString(),
				});
			} else {
				data.guildData.plugins.automod = {
					enabled: false,
					ignored: [],
				};

				data.guildData.markModified("plugins.automod");
				await data.guildData.save();

				interaction.success("administration/automod:DISABLED");
			}
		}
	}
}

module.exports = Automod;
