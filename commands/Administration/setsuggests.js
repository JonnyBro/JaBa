const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Setsuggests extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("setsuggests")
				.setDescription(client.translate("administration/setsuggests:DESCRIPTION"))
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
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		const state = interaction.options.getBoolean("state");
		const channel = interaction.options.getChannel("channel");

		if (!state) {
			data.guildData.plugins.suggestions = null;
			data.guildData.markModified("plugins.suggestions");
			await data.guildData.save();
			return interaction.success("administration/setsuggests:DISABLED");
		} else {
			if (channel) {
				data.guildData.plugins.suggestions = channel.id;
				data.guildData.markModified("plugins.suggestions");
				await data.guildData.save();
				interaction.success("administration/setsuggests:ENABLED", {
					channel: channel.toString()
				});
			} else return interaction.replyT(`administration/setsuggests:${data.guildData.plugins.suggestions ? "ENABLED" : "DISABLED"}`, data.guildData.plugins.suggestions ? { channel: interaction.guild.channels.cache.get(data.guildData.plugins.suggestions).toString() } : null);
		}
	}
}

module.exports = Setsuggests;