const { SlashCommandBuilder } = require("discord.js"),
	{ QueueRepeatMode } = require("discord-player");
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
				.setDescriptionLocalizations({
					uk: client.translate("music/loop:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/loop:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addStringOption(option =>
					option
						.setName("option")
						.setDescription(client.translate("music/loop:OPTION"))
						.setDescriptionLocalizations({
							uk: client.translate("music/loop:OPTION", null, "uk-UA"),
							ru: client.translate("music/loop:OPTION", null, "ru-RU"),
						})
						.setRequired(true)
						.setChoices(
							{ name: client.translate("music/loop:AUTOPLAY"), value: "3" },
							{ name: client.translate("music/loop:QUEUE"), value: "2" },
							{ name: client.translate("music/loop:TRACK"), value: "1" },
							{ name: client.translate("music/loop:DISABLE"), value: "0" },
						),
				),
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

		const queue = client.player.nodes.get(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { edit: true });

		const translated = {
			"AUTOPLAY": interaction.translate("music/loop:AUTOPLAY_ENABLED"),
			"QUEUE": interaction.translate("music/loop:QUEUE_ENABLED"),
			"TRACK": interaction.translate("music/loop:TRACK_ENABLED"),
			"OFF": interaction.translate("music/loop:LOOP_DISABLED"),
		};

		const type = interaction.options.getString("option"),
			mode = QueueRepeatMode[type];

		queue.setRepeatMode(mode);

		interaction.reply({ content: translated[mode] });
	}
}

module.exports = Loop;
