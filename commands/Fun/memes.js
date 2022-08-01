const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, InteractionCollector } = require("discord.js");
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
				.setDescription(client.translate("fun/memes:DESCRIPTION")),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: false
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
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const tags = ["memes", "dankmemes", "me_irl", "wholesomememes"].map(tag =>
			JSON.parse(JSON.stringify({
				label: tag,
				value: tag
			}))
		);

		const row = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId("memes_select")
					.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
					.addOptions(tags)
			);

		const msg = await interaction.reply({
			content: interaction.translate("common:AVAILABLE_CATEGORIES"),
			components: [row],
			fetchReply: true
		});

		const collector = new InteractionCollector(client, {
			message: msg,
			idle: 60 * 1000
		});

		collector.on("collect", async msg => {
			const tag = msg?.values[0];
			const res = await fetch(`https://meme-api.herokuapp.com/gimme/${tag}`).then(response => response.json());

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({
					text: client.config.embed.footer
				})
				.setTitle(`${res.title}\n${interaction.translate("fun/memes:SUBREDDIT")}: ${res.subreddit}\n${interaction.translate("common:AUTHOR")}: ${res.author}\n${interaction.translate("fun/memes:UPS")}: ${res.ups}`)
				.setImage(res.url)
				.setTimestamp();

			msg.update({
				embeds: [embed]
			});
		});
	}
}

module.exports = Memes;