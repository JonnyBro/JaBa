const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
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
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addBooleanOption(option => option.setName("state")
					.setDescription(client.translate("common:STATE"))
					.setRequired(true))
				.addChannelOption(option => option.setName("channel")
					.setDescription(client.translate("common:CHANNEL"))
					.addChannelTypes(ChannelType.GuildText)),
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
		const state = interaction.options.getBoolean("state");
		const channel = interaction.options.getChannel("channel");

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
				data.guildData.plugins.automod.ignored.push(channel);
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