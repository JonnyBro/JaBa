const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Back extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("back")
				.setDescription(client.translate("music/back:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("music/back:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/back:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
		});
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { ephemeral: true });

		const queue = client.player.nodes.get(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { ephemeral: true });
		if (queue.history.isEmpty()) return interaction.error("music/back:NO_PREV_SONG", null, { ephemeral: true });

		queue.history.back();
		interaction.success("music/back:SUCCESS");
	}
}

module.exports = Back;
