const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, InteractionCollector, ComponentType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class NSFW extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("nsfw")
				.setDescription(client.translate("nsfw/nsfw:DESCRIPTION")),
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
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		if (!interaction.channel.nsfw) return interaction.replyT("misc:NSFW_COMMAND", null, { ephemeral: true });

		const tags = ["hentai", "ecchi", "lewdanimegirls", "hentaifemdom", "animefeets", "animebooty", "biganimetiddies", "sideoppai", "ahegao"].map(tag =>
			JSON.parse(JSON.stringify({
				label: tag,
				value: tag
			}))
		);

		const row = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId("nsfw_select")
					.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
					.addOptions(tags)
			);

		const msg = await interaction.reply({
			content: interaction.translate("common:AVAILABLE_OPTIONS"),
			ephemeral: true,
			components: [row],
			fetchReply: true
		});

		const filter = i => i.customId === "nsfw_select" && i.user.id === interaction.user.id;
		const collector = new InteractionCollector(client, {
			filter,
			componentType: ComponentType.SelectMenu,
			message: msg,
			idle: 60 * 1000
		});

		collector.on("collect", async i => {
			const tag = i?.values[0];
			const res = await fetch(`https://meme-api.herokuapp.com/gimme/${tag}`).then(response => response.json());

			const embed = new EmbedBuilder()
				.setColor(client.config.embed.color)
				.setFooter({
					text: client.config.embed.footer
				})
				.setTitle(`${res.title}\n${interaction.translate("fun/memes:SUBREDDIT")}: ${res.subreddit}\n${interaction.translate("common:AUTHOR")}: ${res.author}\n${interaction.translate("fun/memes:UPS")}: ${res.ups}`)
				.setImage(res.url)
				.setTimestamp();

			await i.update({
				embeds: [embed]
			});
		});
	}
}

module.exports = NSFW;