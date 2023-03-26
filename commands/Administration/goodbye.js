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
				.setDescriptionLocalizations({ "uk": client.translate("administration/goodbye:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommand(subcommand => subcommand.setName("test")
					.setDescription(client.translate("administration/goodbye:TEST"))
					.setDescriptionLocalizations({ "uk": client.translate("administration/goodbye:TEST", null, "uk-UA") }),
				)
				.addSubcommand(subcommand => subcommand.setName("config")
					.setDescription(client.translate("administration/goodbye:CONFIG"))
					.setDescriptionLocalizations({ "uk": client.translate("administration/goodbye:CONFIG", null, "uk-UA") })
					.addBooleanOption(option => option.setName("state")
						.setDescription(client.translate("common:STATE"))
						.setDescriptionLocalizations({ "uk": client.translate("common:STATE", null, "uk-UA") })
						.setRequired(true))
					.addChannelOption(option => option.setName("channel")
						.setDescription(client.translate("common:CHANNEL"))
						.setDescriptionLocalizations({ "uk": client.translate("common:CHANNEL", null, "uk-UA") }))
					.addStringOption(option => option.setName("message")
						.setDescription(client.translate("administration/goodbye:MESSAGE"))
						.setDescriptionLocalizations({ "uk": client.translate("common:MESSAGE", null, "uk-UA") }))
					.addBooleanOption(option => option.setName("image")
						.setDescription(client.translate("administration/goodbye:IMAGE"))
						.setDescriptionLocalizations({ "uk": client.translate("common:IMAGE", null, "uk-UA") })),
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
			client.emit("guildMemberRemove", interaction.member);

			interaction.success("administration/goodbye:TEST_SUCCESS", null, { ephemeral: true });
		} else {
			const state = interaction.options.getBoolean("state");

			if (!state) {
				data.guildData.plugins.goodbye = {
					enabled: false,
					message: null,
					channelID: null,
					withImage: null,
				};
				data.guildData.markModified("plugins.goodbye");
				await data.guildData.save();

				interaction.success("administration/goodbye:DISABLED");
			} else {
				const channel = interaction.options.getChannel("channel");
				const message = interaction.options.getString("message") || interaction.translate("administration/goodbye:DEFAULT_MESSAGE");
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
					channel: `<#${data.guildData.plugins.goodbye.channel}>`,
				}, { ephemeral: true });
			}
		}
	}
}

module.exports = Goodbye;