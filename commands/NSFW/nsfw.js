
const { SlashCommandBuilder } = require("@discordjs/builders"),
	{ MessageEmbed, MessageActionRow, MessageSelectMenu, InteractionCollector } = require("discord.js");
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
	 * @param {import("discord.js").CommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		if (!interaction.channel.nsfw) return interaction.replyT("misc:NSFW_COMMAND", null, { ephemeral: true });

		const tags = ["hentai", "ecchi", "lewdanimegirls", "hentaifemdom", "animefeets", "animebooty", "biganimetiddies", "sideoppai", "ahegao"].map(tag =>
			JSON.parse(JSON.stringify({
				label: tag,
				description: "",
				value: tag
			}))
		);

		const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId("nsfw_select")
					.setPlaceholder(client.translate("nsfw/nsfw:NOTHING_SELECTED"))
					.addOptions(tags)
			);

		const msg = await interaction.reply({
			content: interaction.translate("nsfw/nsfw:AVAILABLE_CATEGORIES"),
			ephemeral: true,
			components: [row]
		});

		const collector = new InteractionCollector(client, {
			message: msg,
			time: 60 * 1000
		});

		collector.on("collect", async (msg) => {
			const tag = msg?.values[0];
			const res = await fetch(`https://meme-api.herokuapp.com/gimme/${tag}`).then(response => response.json());

			const embed = new MessageEmbed()
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

module.exports = NSFW;