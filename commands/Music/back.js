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
		const queue = client.player.getQueue(interaction);

		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { ephemeral: true });
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { ephemeral: true });
		if (!queue.previousSongs[0]) return interaction.error("music/back:NO_PREV_SONG", null, { ephemeral: true });

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("music/back:DESCRIPTION")
			})
			.setThumbnail(queue.tracks[0].thumbnail)
			.setDescription(interaction.translate("music/back:SUCCESS"))
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			});
		client.player.previous(interaction);

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Back;