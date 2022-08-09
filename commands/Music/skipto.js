const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Skipto extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("skipto")
				.setDescription(client.translate("music/skipto:DESCRIPTION"))
				.addIntegerOption(option => option.setName("position")
					.setDescription(client.translate("music/skipto:POSITION"))
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
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		const voice = interaction.member.voice.channel;
		const queue = client.player.getQueue(interaction.guildId);
		const position = interaction.options.getInteger("position");

		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return interaction.error("music/play:NOT_PLAYING");
		if (position < 0) return interaction.error("music/skipto:NO_PREV_SONG");

		if (queue.tracks[position - 1]) {
			queue.skipTo(queue.tracks[position - 1]);

			interaction.success("music/skipto:SUCCESS", {
				position: position
			});
		} else return interaction.error("music/skipto:ERROR", { position: position });
	}
}

module.exports = Skipto;