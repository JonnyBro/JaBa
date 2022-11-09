const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Setnews extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("setnews")
				.setDescription(client.translate("administration/setnews:DESCRIPTION"))
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addBooleanOption(option => option.setName("state")
					.setDescription(client.translate("common:STATE"))
					.setRequired(true))
				.addChannelOption(option => option.setName("channel")
					.setDescription(client.translate("common:CHANNEL"))
					.addChannelTypes(ChannelType.GuildText)),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false
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

		if (!state) {
			data.guildData.plugins.news = null;
			data.guildData.markModified("plugins.news");
			await data.guildData.save();
			return interaction.success("administration/setnews:DISABLED");
		} else {
			if (channel) {
				data.guildData.plugins.news = channel.id;
				data.guildData.markModified("plugins.news");
				await data.guildData.save();
				interaction.success("administration/setnews:ENABLED", {
					channel: channel.toString()
				});
			} else return interaction.replyT(`administration/setnews:${data.guildData.plugins.news ? "ENABLED" : "DISABLED"}`, data.guildData.plugins.news ? { channel: interaction.guild.channels.cache.get(data.guildData.plugins.news).toString() } : null);
		}
	}
}

module.exports = Setnews;