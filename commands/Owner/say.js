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
				.setDMPermission(false)
				.addStringOption(option => option.setName("message")
					.setDescription(client.translate("common:MESSAGE"))
					.setRequired(true))
				.addChannelOption(option => option.setName("channel")
					.setDescription(client.translate("common:CHANNEL"))),
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