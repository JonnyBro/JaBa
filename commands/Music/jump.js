const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Jump extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("jump")
				.setDescription(client.translate("music/jump:DESCRIPTION"))
				.addIntegerOption(option => option.setName("position")
					.setDescription("music/jump:POSITION")
					.setRequired(true)),
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
		const queue = client.player.getQueue(interaction);
		const voice = interaction.member.voice.channel;
		const position = interaction.options.getInteger("position");

		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return interaction.error("music/play:NOT_PLAYING");
		if (position < 0) return interaction.error("music/jump:NO_PREV_SONG");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("music/jump:SUCCESS")
			})
			.setThumbnail(queue.songs[position].thumbnail)
			.setDescription(interaction.translate("music/play:NOW_PLAYING", {
				songName: queue.songs[position].name
			}))
			.setFooter({
				text: client.config.embed.footer
			})
			.setColor(client.config.embed.color);
		client.player.jump(interaction, position);

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Jump;