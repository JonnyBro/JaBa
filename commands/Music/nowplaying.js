const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
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
				.setDescription(client.translate("music/nowplaying:DESCRIPTION")),
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
		const voice = interaction.member.voice.channel;
		const queue = client.player.getQueue(interaction);

		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		const track = queue.songs[0];

		const status = queue =>
			`${interaction.translate("music/nowplaying:REPEAT")}: \`${
				queue.repeatMode
					? queue.repeatMode === 2 ? interaction.translate("music/nowplaying:QUEUE") : interaction.translate("music/nowplaying:SONG")
					: interaction.translate("music/nowplaying:DISABLED")
			}\` | ${interaction.translate("music/nowplaying:AUTOPLAY")}: \`${
				queue.autoplay
					? interaction.translate("music/nowplaying:ENABLED")
					: interaction.translate("music/nowplaying:DISABLED")
			}\``;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("music/queue:TITLE")
			})
			.setThumbnail(track.thumbnail)
			.addFields([
				{
					name: interaction.translate("music/nowplaying:T_TITLE"),
					value: `[${track.name}](${track.url})`
				},
				{
					name: interaction.translate("music/nowplaying:T_CHANNEL"),
					value: track.uploader.name || interaction.translate("common:UNKNOWN")
				},
				{
					name: interaction.translate("music/nowplaying:T_DURATION"),
					value: `${queue.formattedCurrentTime} / ${track.duration > 1 ? track.formattedDuration : interaction.translate("music/play:LIVE")}`
				},
				{
					name: interaction.translate("music/nowplaying:T_CONF"),
					value: status(queue)
				}
			])
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			})
			.setTimestamp();

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Nowplaying;