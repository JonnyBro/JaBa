const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Setmodlogs extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("setmodlogs")
				.setDescription(client.translate("administration/setmodlogs:DESCRIPTION"))
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
			data.guildData.plugins.modlogs = null;
			data.guildData.markModified("plugins.modlogs");
			await data.guildData.save();
			return interaction.success("administration/setmodlogs:DISABLED");
		} else {
			if (channel) {
				data.guildData.plugins.modlogs = channel.id;
				data.guildData.markModified("plugins.modlogs");
				await data.guildData.save();
				interaction.success("administration/setmodlogs:ENABLED", {
					channel: channel.toString()
				});
			} else return interaction.replyT(`administration/setmodlogs:${data.guildData.plugins.modlogs ? "ENABLED" : "DISABLED"}`, data.guildData.plugins.modlogs ? { channel: interaction.guild.channels.cache.get(data.guildData.plugins.modlogs).toString() } : null);
		}
	}
}

module.exports = Setmodlogs;