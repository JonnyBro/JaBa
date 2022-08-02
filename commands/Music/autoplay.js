const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class AutoPlay extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("autoplay")
				.setDescription(client.translate("music/autoplay:DESCRIPTION")),
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

		const autoplay = queue.toggleAutoplay();

		interaction.success(`music/autoplay:SUCCESS_${autoplay ? "ENABLED" : "DISABLED"}`);
	}
}

module.exports = AutoPlay;