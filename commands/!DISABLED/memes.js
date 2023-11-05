const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Memes extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
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
	 * @param {import("../../base/Client")} client
	 */
	async onLoad(client) {
		client.on("interactionCreate", async interaction => {
			if (!interaction.isStringSelectMenu()) return;

			if (interaction.customId === "memes_select") {
				interaction.deferUpdate();

				const tag = interaction.values[0];
				const res = await fetch(`https://meme-api.com/gimme/${tag}`).then(response => response.json());

				const embed = new EmbedBuilder()
					.setColor(client.config.embed.color)
					.setFooter(client.config.embed.footer)
					.setTitle(res.title)
					.setDescription(`${interaction.translate("fun/memes:SUBREDDIT")}: **${res.subreddit}**\n${interaction.translate("common:AUTHOR")}: **${res.author}**\n${interaction.translate("fun/memes:UPS")}: **${res.ups}**`)
					.setImage(res.url)
					.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
				});
			}
		});
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const tags = ["funny", "memes", "dankmemes", "me_irl", "wholesomememes"].map(tag =>
			JSON.parse(
				JSON.stringify({
					label: tag,
					value: tag,
				}),
			),
		);

		const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("memes_select").setPlaceholder(interaction.translate("common:NOTHING_SELECTED")).addOptions(tags));

		await interaction.editReply({
			components: [row],
		});
	}
}

module.exports = Memes;
