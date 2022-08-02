const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Stop extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("stop")
				.setDescription(client.translate("music/stop:DESCRIPTION")),
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

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("music/stop:DESCRIPTION")
			})
			.setDescription(interaction.translate("music/stop:SUCCESS"))
			.setFooter({
				text: client.config.embed.footer
			})
			.setColor(client.config.embed.color);
		client.player.stop(interaction);

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Stop;