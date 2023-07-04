const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Sendmessage extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("sendmessage")
				.setDescription(client.translate("suncountry/sendmessage:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("suncountry/sendmessage:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("suncountry/sendmessage:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true)
				.addSubcommand(subcommand =>
					subcommand
						.setName("rpinfo")
						.setDescription(client.translate("suncountry/sendmessage:RPINFO"))
						.setDescriptionLocalizations({
							uk: client.translate("suncountry/sendmessage:RPINFO", null, "uk-UA"),
							ru: client.translate("suncountry/sendmessage:RPINFO", null, "ru-RU"),
						})
						.addStringOption(option =>
							option
								.setName("text")
								.setDescription(client.translate("common:MESSAGE"))
								.setDescriptionLocalizations({
									uk: client.translate("common:MESSAGE", null, "uk-UA"),
									ru: client.translate("common:MESSAGE", null, "ru-RU"),
								})
								.setRequired(true),
						)
						.addAttachmentOption(option =>
							option
								.setName("attachment")
								.setDescription(client.translate("common:ATTACHMENT"))
								.setDescriptionLocalizations({
									uk: client.translate("common:ATTACHMENT", null, "uk-UA"),
									ru: client.translate("common:ATTACHMENT", null, "ru-RU"),
								}),
						),
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName("instalife")
						.setDescription(client.translate("suncountry/sendmessage:INSTALIFE"))
						.setDescriptionLocalizations({
							uk: client.translate("suncountry/sendmessage:INSTALIFE", null, "uk-UA"),
							ru: client.translate("suncountry/sendmessage:INSTALIFE", null, "ru-RU"),
						})
						.addStringOption(option =>
							option
								.setName("name")
								.setDescription(client.translate("common:USERNAME"))
								.setDescriptionLocalizations({
									uk: client.translate("common:USERNAME", null, "uk-UA"),
									ru: client.translate("common:USERNAME", null, "ru-RU"),
								})
								.setRequired(true),
						)
						.addStringOption(option =>
							option
								.setName("text")
								.setDescription(client.translate("common:MESSAGE"))
								.setDescriptionLocalizations({
									uk: client.translate("common:MESSAGE", null, "uk-UA"),
									ru: client.translate("common:MESSAGE", null, "ru-RU"),
								})
								.setRequired(true),
						)
						.addAttachmentOption(option =>
							option
								.setName("attachment")
								.setDescription(client.translate("common:ATTACHMENT"))
								.setDescriptionLocalizations({
									uk: client.translate("common:ATTACHMENT", null, "uk-UA"),
									ru: client.translate("common:ATTACHMENT", null, "ru-RU"),
								}),
						),
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
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const command = interaction.options.getSubcommand(),
			guild = client.guilds.cache.get("600970971410857996"),
			channel = command === "rpinfo" ? guild.channels.cache.get("1119571321421058098") : guild.channels.cache.get("1119579266376540213");

		const text = interaction.options.getString("text"),
			name = interaction.options.getString("name"),
			attachment = interaction.options.getAttachment("attachment");

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setTitle(`@${name}`)
			.setAuthor({
				name: "InstaLife",
			})
			.setImage(attachment ? attachment.url : null)
			.setDescription(text);

		const content = command === "rpinfo" ? text : null,
			files = command === "rpinfo" ? (attachment ? [{
				name: attachment.name,
				attachment: attachment.url,
			}] : null) : null,
			embeds = command === "instalife" ? [embed] : null;

		channel.send({
			content,
			files,
			embeds,
		}) .then(message => {
			interaction.success("suncountry/sendmessage:MESSAGE_SENT", {
				message: message.url,
			}, { edit: true });
		});
	}
}

module.exports = Sendmessage;
