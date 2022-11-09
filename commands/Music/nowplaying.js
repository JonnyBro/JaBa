const { SlashCommandBuilder, EmbedBuilder } = require("discord.js"),
	{ QueueRepeatMode } = require("discord-player-play-dl");
const BaseCommand = require("../../base/BaseCommand");

class Nowplaying extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("nowplaying")
				.setDescription(client.translate("music/nowplaying:DESCRIPTION"))
				.setDMPermission(false),
			aliases: [],
			dirname: __dirname,
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
		await interaction.deferReply();

		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { edit: true });
		const progressBar = queue.createProgressBar();
		const track = queue.current;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("music/nowplaying:CURRENTLY_PLAYING")
			})
			.setThumbnail(track.thumbnail)
			.addFields([
				{
					name: interaction.translate("music/nowplaying:T_TITLE"),
					value: `[${track.title}](${track.url})`,
					inline: true
				},
				{
					name: interaction.translate("music/nowplaying:T_AUTHOR"),
					value: track.author || interaction.translate("common:UNKNOWN"),
					inline: true
				},
				{ name: "\u200B", value: "\u200B", inline: true },
				{
					name: interaction.translate("common:VIEWS"),
					value: new Intl.NumberFormat(interaction.client.languages.find(language => language.name === interaction.guild.data.language).moment, { notation: "standard" }).format(track.views),
					inline: true
				},
				{
					name: interaction.translate("music/queue:ADDED"),
					value: track.requestedBy.toString(),
					inline: true
				},
				{
					name: interaction.translate("music/nowplaying:T_DURATION"),
					value: progressBar
				},
				{
					name: "\u200b",
					value: `${interaction.translate("music/nowplaying:REPEAT")}: \`${
						queue.repeatMode === QueueRepeatMode.AUTOPLAY ? interaction.translate("music/nowplaying:AUTOPLAY") :
							queue.repeatMode === QueueRepeatMode.QUEUE ? interaction.translate("music/nowplaying:QUEUE") :
								queue.repeatMode === QueueRepeatMode.TRACK ? interaction.translate("music/nowplaying:TRACK") : interaction.translate("common:DISABLED")
					}\``
				}
			])
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			})
			.setTimestamp();

		interaction.editReply({
			embeds: [embed]
		});
	}
}

module.exports = Nowplaying;