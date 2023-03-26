const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Say extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("say")
				.setDescription(client.translate("owner/say:DESCRIPTION"))
				.setDescriptionLocalizations({ "uk": client.translate("owner/say:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(false)
				.addStringOption(option => option.setName("message")
					.setDescription(client.translate("common:MESSAGE"))
					.setDescriptionLocalizations({ "uk": client.translate("common:MESSAGE", null, "uk-UA") })
					.setRequired(true))
				.addChannelOption(option => option.setName("channel")
					.setDescription(client.translate("common:CHANNEL"))
					.setDescriptionLocalizations({ "uk": client.translate("common:CHANNEL", null, "uk-UA") })),
			aliases: [],
			dirname: __dirname,
			ownerOnly: true,
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
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const message = interaction.options.getString("message"),
			channel = interaction.options.getChannel("channel");

		if (!channel) {
			interaction.channel.sendTyping();

			setTimeout(function () {
				interaction.channel.send({
					content: message,
				});

				interaction.replyT("owner/say:DONE", {
					message,
					channel: interaction.channel.toString(),
				}, { edit: true });
			}, 2000);
		} else {
			channel.sendTyping();

			setTimeout(function () {
				channel.send({
					content: message,
				});

				interaction.replyT("owner/say:DONE", {
					message,
					channel: channel.toString(),
				}, { edit: true });
			}, 2000);
		}
	}
}

module.exports = Say;