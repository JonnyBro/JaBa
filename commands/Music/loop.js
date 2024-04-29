const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Loop extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
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
							// { name: client.translate("music/loop:AUTOPLAY"), value: "3" },
							{ name: client.translate("music/loop:QUEUE"), value: "queue" },
							{ name: client.translate("music/loop:TRACK"), value: "track" },
							{ name: client.translate("music/loop:DISABLE"), value: "off" },
						),
				),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { edit: true });

		const player = client.lavalink.getPlayer(interaction.guildId);
		if (!player) return interaction.error("music/play:NOT_PLAYING", null, { edit: true });

		const type = interaction.options.getString("option");

		const translated = {
			// "3": interaction.translate("music/loop:AUTOPLAY_ENABLED"),
			"queue": interaction.translate("music/loop:QUEUE_ENABLED"),
			"track": interaction.translate("music/loop:TRACK_ENABLED"),
			"off": interaction.translate("music/loop:LOOP_DISABLED"),
		};

		await player.setRepeatMode(type);
		interaction.editReply({ content: translated[type] });
	}
}

module.exports = Loop;
