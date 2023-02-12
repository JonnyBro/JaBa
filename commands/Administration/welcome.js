const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Welcome extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("welcome")
				.setDescription(client.translate("administration/welcome:DESCRIPTION"))
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommand(subcommand => subcommand.setName("test")
					.setDescription(client.translate("administration/goodbye:TEST")),
				)
				.addSubcommand(subcommand => subcommand.setName("config")
					.setDescription(client.translate("administration/goodbye:CONFIG"))
					.addBooleanOption(option => option.setName("state")
						.setDescription(client.translate("common:STATE"))
						.setRequired(true))
					.addChannelOption(option => option.setName("channel")
						.setDescription(client.translate("common:CHANNEL")))
					.addStringOption(option => option.setName("message")
						.setDescription(client.translate("administration/goodbye:MESSAGE")))
					.addBooleanOption(option => option.setName("image")
						.setDescription(client.translate("administration/goodbye:IMAGE"))),
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
		const command = interaction.options.getSubcommand();

		if (command === "test") {
			client.emit("guildMemberAdd", interaction.member);

			interaction.success("administration/goodbye:TEST_SUCCESS", null, { ephemeral: true });
		} else {
			const state = interaction.options.getBoolean("state");

			if (!state) {
				data.guildData.plugins.welcome = {
					enabled: false,
					message: null,
					channelID: null,
					withImage: null,
				};
				data.guildData.markModified("plugins.welcome");
				await data.guildData.save();

				interaction.success("administration/welcome:DISABLED");
			} else {
				const channel = interaction.options.getChannel("channel");
				const message = interaction.options.getString("message") || interaction.translate("administration/welcome:DEFAULT_MESSAGE");
				const image = interaction.options.getBoolean("image");

				data.guildData.plugins.welcome = {
					enabled: true,
					channel: channel.id,
					message: message,
					withImage: image,
				};
				data.guildData.markModified("plugins.welcome");
				await data.guildData.save();

				interaction.success("administration/welcome:ENABLED", {
					channel: `<#${data.guildData.plugins.welcome.channel}>`,
				}, { ephemeral: true });
			}
		}
	}
}

module.exports = Welcome;