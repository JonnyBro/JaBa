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
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		const skipped = queue.skip();
		if (skipped) {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: interaction.translate("music/skip:SUCCESS")
				})
				.setThumbnail(queue.current.thumbnail || null)
				.setDescription(interaction.translate("music/play:NOW_PLAYING", {
					songName: queue.current.title
				}))
				.setFooter({
					text: client.config.embed.footer
				})
				.setColor(client.config.embed.color);

			interaction.reply({
				embeds: [embed]
			});
		}
	}
}

module.exports = Skip;