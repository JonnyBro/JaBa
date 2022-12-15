const { SlashCommandBuilder } = require("discord.js"),
	{ QueueRepeatMode } = require("discord-player-play-dl");
const BaseCommand = require("../../base/BaseCommand");

class Loop extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("loop")
				.setDescription(client.translate("music/loop:DESCRIPTION"))
				.setDMPermission(false)
				.addStringOption(option => option.setName("option")
					.setDescription(client.translate("economy/bank:OPTION"))
					.setRequired(true)
					.addChoices(
						{ name: client.translate("music/loop:AUTOPLAY"), value: "3" },
						{ name: client.translate("music/loop:QUEUE"), value: "2" },
						{ name: client.translate("music/loop:TRACK"), value: "1" },
						{ name: client.translate("music/loop:DISABLE"), value: "0" },
					)),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
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
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { edit: true });
		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { edit: true });

		const type = interaction.options.getString("option");
		const mode = type === "3" ? QueueRepeatMode.AUTOPLAY :
			type === "2" ? QueueRepeatMode.QUEUE :
				type === "1" ? QueueRepeatMode.TRACK : QueueRepeatMode.OFF;

		queue.setRepeatMode(mode);

		interaction.success(`music/loop:${
			type === "3" ? "AUTOPLAY_ENABLED" :
				type === "2" ? "QUEUE_ENABLED" :
					type === "1" ? "TRACK_ENABLED" : "LOOP_DISABLED"
		}`);
	}
}

module.exports = Loop;