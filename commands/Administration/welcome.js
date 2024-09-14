const { SlashCommandBuilder, PermissionsBitField, InteractionContextType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Welcome extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("welcome")
				.setDescription(client.translate("administration/welcome:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("administration/welcome:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("administration/welcome:DESCRIPTION", null, "ru-RU"),
				})
				.setContexts([InteractionContextType.Guild])
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addSubcommand(subcommand =>
					subcommand
						.setName("test")
						.setDescription(client.translate("administration/goodbye:TEST"))
						.setDescriptionLocalizations({
							uk: client.translate("administration/goodbye:TEST", null, "uk-UA"),
							ru: client.translate("administration/goodbye:TEST", null, "ru-RU"),
						}),
				)
				.addSubcommand(
					subcommand =>
						subcommand
							.setName("config")
							.setDescription(client.translate("administration/goodbye:CONFIG"))
							.setDescriptionLocalizations({
								uk: client.translate("administration/goodbye:CONFIG", null, "uk-UA"),
								ru: client.translate("administration/goodbye:CONFIG", null, "ru-RU"),
							})
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
									}),
							)
							.addStringOption(option =>
								option
									.setName("message")
									.setDescription(client.translate("administration/goodbye:MESSAGE"))
									.setDescriptionLocalizations({
										uk: client.translate("administration/goodbye:MESSAGE", null, "uk-UA"),
										ru: client.translate("administration/goodbye:MESSAGE", null, "ru-RU"),
									}),
							),
					// .addBooleanOption(option =>
					// 	option
					// 		.setName("image")
					// 		.setDescription(client.translate("administration/goodbye:IMAGE"))
					// 		.setDescriptionLocalizations({
					// 			uk: client.translate("administration/goodbye:IMAGE", null, "uk-UA"),
					// 			ru: client.translate("administration/goodbye:IMAGE", null, "ru-RU"),
					// 		}),
					// ),
				),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const guildData = interaction.data.guild,
			command = interaction.options.getSubcommand();

		if (command === "test") {
			client.emit("guildMemberAdd", client, interaction.member);

			interaction.success("administration/goodbye:TEST_SUCCESS", null, { edit: true });
		} else {
			const state = interaction.options.getBoolean("state");

			if (!state) {
				guildData.plugins.welcome = {
					enabled: false,
					message: null,
					channelID: null,
					withImage: null,
				};

				guildData.markModified("plugins.welcome");
				await guildData.save();

				interaction.success("administration/welcome:DISABLED", null);
			} else {
				const channel = interaction.options.getChannel("channel") || interaction.channel;
				const message = interaction.options.getString("message") || interaction.translate("administration/welcome:DEFAULT_MESSAGE");
				const image = false; // interaction.options.getBoolean("image") || false;

				guildData.plugins.welcome = {
					enabled: true,
					channel: channel.id,
					message: message,
					withImage: image,
				};

				guildData.markModified("plugins.welcome");
				await guildData.save();

				interaction.success("administration/welcome:ENABLED", {
					channel: `${channel.toString()}`,
				}, { edit: true });
			}
		}
	}
}

module.exports = Welcome;
