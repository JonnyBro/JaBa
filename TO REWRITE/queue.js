const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	{ sendPaginatedEmbeds } = require("discord.js-embed-pagination");

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
		const voice = interaction.member.voice.channel;
		const queue = client.player.getQueue(interaction);

		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		if (queue.songs.length === 1) {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: interaction.translate("music/queue:TITLE"),
					iconURL: interaction.guild.iconURL()
				})
				.addFields([
					{
						name: interaction.translate("music/nowplaying:CURRENTLY_PLAYING"),
						value: `[${queue.songs[0].name}](${queue.songs[0].url})\n*${interaction.translate("music/queue:ADDED")} ${queue.songs[0].member}*\n`
					}
				])
				.setColor(client.config.embed.color);
			return interaction.reply({
				embeds: [embed]
			});
		}

		const songs = queue.songs.slice(1, queue.songs.length).map(song => {
			return {
				name: interaction.translate("music/queue:TITLE"),
				value: `**${queue.songs.indexOf(song)}**. [${song.name}](${song.url})\n*${interaction.translate("music/queue:ADDED")} ${song.member}*\n`
			};
		});

		const pages = songs.map(song => {
			new EmbedBuilder()
				.setAuthor({
					name: interaction.translate("music/queue:TITLE"),
					iconURL: interaction.guild.iconURL()
				})
				.setColor(client.config.embed.color)
				.addFields([
					// {
					// 	name: interaction.translate("music/nowplaying:CURRENTLY_PLAYING"),
					// 	value: `[${queue.songs[0].name}](${queue.songs[0].url})\n*${interaction.translate("music/queue:ADDED")} ${queue.songs[0].member}*\n`
					// },
					...songs
				]);
		});

		sendPaginatedEmbeds(interaction, pages, {
			previousLabel: interaction.translate("music/queue:"),
			nextLabel: interaction.translate("music/queue:"),
			pageLabel: interaction.translate("music/queue:"),
			content: `${interaction.translate("music/nowplaying:CURRENTLY_PLAYING")}\n[${queue.songs[0].name}](${queue.songs[0].url})\n*${interaction.translate("music/queue:ADDED")} ${queue.songs[0].member}*\n`,
			showPagePosition: true,
			time: 120000
		});

		// FieldsEmbed.embed
		// 	.setColor(client.config.embed.color)
		// 	.setAuthor({
		// 		name: interaction.translate("music/queue:TITLE"),
		// 		iconURL: interaction.guild.iconURL()
		// 	})
		// 	.addFields([
		// 		{
		// 			name: interaction.translate("music/nowplaying:CURRENTLY_PLAYING"),
		// 			value: `[${queue.songs[0].name}](${queue.songs[0].url})\n*${interaction.translate("music/queue:ADDED")} ${queue.songs[0].member}*\n`
		// 		}
		// 	]);
		// FieldsEmbed
		// 	.setArray(queue.songs[1] ? queue.songs.slice(1, queue.songs.length) : [])
		// 	.setAuthorizedUsers([interaction.member.id])
		// 	.setChannel(interaction.channel)
		// 	.setElementsPerPage(5)
		// 	.setDeleteOnTimeout(true)
		// 	.setPageIndicator(true)
		// 	.formatField(interaction.translate("music/queue:TITLE"), (track) => `**${queue.songs.indexOf(track)}**. [${track.name}](${track.url})\n*${interaction.translate("music/queue:ADDED")} ${track.member}*\n`)
		// 	.build();
	}
}

module.exports = Queue;