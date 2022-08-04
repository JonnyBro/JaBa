const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Back extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("back")
				.setDescription(client.translate("music/back:DESCRIPTION")),
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
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { ephemeral: true });
		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { ephemeral: true });
		if (!queue.previousTracks[0]) return interaction.error("music/back:NO_PREV_SONG", null, { ephemeral: true });

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("music/back:SUCCESS")
			})
			.setThumbnail(queue.current.thumbnail)
			.setDescription(`[${queue.current.title}](${queue.current.url})`)
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			});

		queue.back()
			.then(() => interaction.reply({ embeds: [embed] }));
	}
}

module.exports = Back;