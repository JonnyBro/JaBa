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
				.setDescriptionLocalizations({
					uk: client.translate("music/skipto:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/skipto:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addIntegerOption(option =>
					option
						.setName("position")
						.setDescription(client.translate("music/skipto:POSITION"))
						.setDescriptionLocalizations({
							uk: client.translate("music/skipto:POSITION", null, "uk-UA"),
							ru: client.translate("music/skipto:POSITION", null, "ru-RU"),
						})
						.setRequired(true),
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
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");

		const queue = client.player.nodes.get(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		const position = interaction.options.getInteger("position");
		if (position <= 0) return interaction.error("music/skipto:NO_PREV_SONG");

		if (queue.tracks.at(position - 1)) {
			queue.node.skipTo(queue.tracks.at(position - 1));

			interaction.success("music/skipto:SUCCESS", {
				position,
			});
		} else return interaction.error("music/skipto:ERROR", { position: position });
	}
}

module.exports = Skipto;
