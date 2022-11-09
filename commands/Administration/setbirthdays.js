const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Setbirthdays extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("setbirthdays")
				.setDescription(client.translate("administration/setbirthdays:DESCRIPTION"))
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
			data.guildData.plugins.birthdays = null;
			data.guildData.markModified("plugins.birthdays");
			await data.guildData.save();
			return interaction.success("administration/setbirthdays:DISABLED");
		} else {
			if (channel) {
				data.guildData.plugins.birthdays = channel.id;
				data.guildData.markModified("plugins.birthdays");
				await data.guildData.save();
				interaction.success("administration/setbirthdays:ENABLED", {
					channel: channel.toString()
				});
			} else return interaction.replyT(`administration/setbirthdays:${data.guildData.plugins.birthdays ? "ENABLED" : "DISABLED"}`, data.guildData.plugins.birthdays ? { channel: interaction.guild.channels.cache.get(data.guildData.plugins.birthdays).toString() } : null);
		}
	}
}

module.exports = Setbirthdays;