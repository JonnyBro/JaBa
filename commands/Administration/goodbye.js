const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Goodbye extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("goodbye")
				.setDescription(client.translate("administration/goodbye:DESCRIPTION"))
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addSubcommand(subcommand => subcommand.setName("test")
					.setDescription(client.translate("administration/goodbye:TEST"))
				)
				.addSubcommand(subcommand => subcommand.setName("config")
					.setDescription(client.translate("administration/goodbye:CONFIG"))
					.addBooleanOption(option => option.setName("state")
						.setDescription(client.translate("common:STATE"))
						.setRequired(true))
					.addChannelOption(option => option.setName("channel")
						.setDescription(client.translate("common:CHANNEL")))
					.addStringOption(option => option.setName("message")
						.setDescription(client.translate("common:MESSAGE")))
					.addBooleanOption(option => option.setName("image")
						.setDescription(client.translate("administration/goodbye:IMAGE")))
				),
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
		const command = interaction.options.getSubcommand();

		if (command === "test") {
			client.emit("guildMemberRemove", interaction.member);
			return interaction.success("administration/goodbye:TEST_SUCCESS");
		} else {
			const state = interaction.options.getBoolean("state");

			if (!state) {
				data.guildData.plugins.goodbye = {
					enabled: false,
					message: null,
					channelID: null,
					withImage: null
				};
				data.guildData.markModified("plugins.goodbye");
				await data.guildData.save();

				interaction.success("administration/goodbye:DISABLED");
			} else {
				const channel = interaction.options.getChannel("channel");
				const message = interaction.options.getString("message");
				const image = interaction.options.getBoolean("image");

				data.guildData.plugins.goodbye = {
					enabled: true,
					channel: channel.id,
					message: message,
					withImage: image,
				};
				data.guildData.markModified("plugins.goodbye");
				await data.guildData.save();

				interaction.success("administration/goodbye:ENABLED", {
					channel: `<#${data.guildData.plugins.goodbye.channel}>`
				});
			}
		}
	}
}

module.exports = Goodbye;