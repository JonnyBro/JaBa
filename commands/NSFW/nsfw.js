const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class NSFW extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("nsfw")
				.setDescription(client.translate("nsfw/nsfw:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("nsfw/nsfw:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("nsfw/nsfw:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true),
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

			if (interaction.customId === "nsfw_select") {
				await interaction.deferUpdate();

				const tag = interaction?.values[0];
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

		if (interaction.guildId && !interaction.channel.nsfw) return interaction.replyT("misc:NSFW_COMMAND", null, { edit: true });

		const tags = ["hentai", "ecchi", "lewdanimegirls", "hentaifemdom", "animefeets", "animebooty", "biganimetiddies", "sideoppai", "ahegao"].map(tag =>
			JSON.parse(
				JSON.stringify({
					label: tag,
					value: tag,
				}),
			),
		);

		const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("nsfw_select").setPlaceholder(interaction.translate("common:NOTHING_SELECTED")).addOptions(tags));

		await interaction.editReply({
			content: interaction.translate("common:AVAILABLE_OPTIONS"),
			ephemeral: true,
			fetchReply: true,
			components: [row],
		});
	}
}

module.exports = NSFW;
