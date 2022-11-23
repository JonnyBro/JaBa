const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Shuffle extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("shuffle")
				.setDescription(client.translate("music/shuffle:DESCRIPTION"))
				.setDMPermission(false),
			aliases: [],
			dirname: __dirname,
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
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { ephemeral: true });
		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { ephemeral: true });

		queue.shuffle();
		interaction.success("music/shuffle:SUCCESS");
	}
}

module.exports = Shuffle;