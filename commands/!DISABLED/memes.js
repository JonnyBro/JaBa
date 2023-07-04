const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Memes extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("memes")
				.setDescription(client.translate("fun/memes:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("fun/memes:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("fun/memes:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
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
		await interaction.deferReply();

		const tags = ["funny", "memes", "dankmemes", "me_irl", "wholesomememes"].map(tag =>
			JSON.parse(
				JSON.stringify({
					label: tag,
					value: tag,
				}),
			),
		);

		const row = new ActionRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("memes_select")
				.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
				.addOptions(tags),
		);

		const msg = await interaction.editReply({
			content: interaction.translate("common:AVAILABLE_OPTIONS"),
			fetchReply: true,
			components: [row],
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = msg.createMessageComponentCollector({ filter, idle: 2 * 60 * 1000 });

		collector.on("collect", async i => {
			if (i.isStringSelectMenu() && i.customId === "memes_select") {
				i.deferUpdate();

				const tag = i.values[0];
				const res = await fetch(`https://meme-api.com/gimme/${tag}`).then(response => response.json());

				const embed = new EmbedBuilder()
					.setColor(client.config.embed.color)
					.setFooter({
						text: client.config.embed.footer,
					})
					.setTitle(res.title)
					.setDescription(`${interaction.translate("fun/memes:SUBREDDIT")}: **${res.subreddit}**\n${interaction.translate("common:AUTHOR")}: **${res.author}**\n${interaction.translate("fun/memes:UPS")}: **${res.ups}**`)
					.setImage(res.url)
					.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
				});
			}
		});

		collector.on("end", () => {
			return interaction.editReply({
				components: [],
			});
		});
	}
}

module.exports = Memes;
