const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Skip extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("skip")
				.setDescription(client.translate("music/skip:DESCRIPTION")),
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
		if (!queue.songs[1]) return interaction.error("music/skip:NO_NEXT_SONG");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("music/skip:SUCCESS")
			})
			.setThumbnail(queue.songs[1].thumbnail)
			.setDescription(interaction.translate("music/play:NOW_PLAYING", {
				songName: queue.songs[1].name
			}))
			.setFooter({
				text: client.config.embed.footer
			})
			.setColor(client.config.embed.color);
		client.player.skip(interaction);

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Skip;