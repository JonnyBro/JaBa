const { SlashCommandBuilder, EmbedBuilder, parseEmoji } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Emoji extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("emoji")
				.setDescription(client.translate("general/emoji:DESCRIPTION"))
				.setDMPermission(true)
				.addStringOption(option => option.setName("emoji")
					.setDescription(client.translate("common:EMOJI"))
					.setRequired(true)),
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
		const rawEmoji = interaction.options.getString("emoji");
		const parsedEmoji = parseEmoji(rawEmoji);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("general/emoji:TITLE", {
					emoji: parsedEmoji.name,
				}),
			})
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer,
			})
			.addFields([
				{
					name: interaction.translate("common:NAME"),
					value: parsedEmoji.name,
				},
				{
					name: interaction.translate("general/emoji:ANIMATED"),
					value: parsedEmoji.animated ? interaction.translate("common:YES") : interaction.translate("common:NO"),
				},
				{
					name: interaction.translate("common:ID"),
					value: parsedEmoji.id?.toString() || interaction.translate("general/emoji:STANDART"),
				},
				{
					name: interaction.translate("general/emoji:LINK"),
					value: `https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${parsedEmoji.animated ? "gif" : "png"}`,
				},
			]);

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Emoji;