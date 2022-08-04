const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Queue extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("queue")
				.setDescription(client.translate("music/queue:DESCRIPTION")),
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
		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		const currentTrack = queue.current;
		const tracks = queue.tracks.slice(0, 10).map((track, i) => {
			return `${i + 1}. [${track.title}](${track.url})\n> ${interaction.translate("music/queue:ADDED")} ${track.requestedBy}`;
		});

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("music/queue:TITLE"),
				iconURL: interaction.guild.iconURL()
			})
			.setColor(client.config.embed.color)
			.addFields(
				{
					name: interaction.translate("music/nowplaying:CURRENTLY_PLAYING"),
					value: `[${currentTrack.title}](${currentTrack.url})\n> ${interaction.translate("music/queue:ADDED")} ${currentTrack.requestedBy}`
				},
				{
					name: "\u200b",
					value: `${tracks.join("\n")}\n${interaction.translate("music/queue:MORE", {
						tracks: `${queue.tracks.length - tracks.length} ${client.getNoun(queue.tracks.length - tracks.length, interaction.translate("misc:NOUNS:TRACKS:1"), interaction.translate("misc:NOUNS:TRACKS:2"), interaction.translate("misc:NOUNS:TRACKS:5"))}`
					})}`
				}
			);

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Queue;