const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Setreports extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("setreports")
				.setDescription(client.translate("administration/setreports:DESCRIPTION"))
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addBooleanOption(option => option.setName("state")
					.setDescription(client.translate("common:STATE"))
					.setRequired(true))
				.addChannelOption(option => option.setName("channel")
					.setDescription(client.translate("common:CHANNEL"))
					.addChannelTypes(ChannelType.GuildText)),
			aliases: [],
			dirname: __dirname,
			guildOnly: true
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
	async execute(client, interaction, data) {
		const state = interaction.options.getBoolean("state");
		const channel = interaction.options.getChannel("channel");

		if (!state) {
			data.guildData.plugins.reports = null;
			data.guildData.markModified("plugins.reports");
			await data.guildData.save();
			return interaction.success("administration/setreports:DISABLED");
		} else {
			if (channel) {
				data.guildData.plugins.reports = channel.id;
				data.guildData.markModified("plugins.reports");
				await data.guildData.save();
				interaction.success("administration/setreports:ENABLED", {
					channel: channel.toString()
				});
			} else return interaction.replyT(`administration/setreports:${data.guildData.plugins.reports ? "ENABLED" : "DISABLED"}`, data.guildData.plugins.reports ? { channel: interaction.guild.channels.cache.get(data.guildData.plugins.reports).toString() } : null);
		}
	}
}

module.exports = Setreports;