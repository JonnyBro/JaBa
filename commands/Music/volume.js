const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Volume extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("volume")
				.setDescription(client.translate("music/volume:DESCRIPTION"))
				.setDescriptionLocalizations({
					"uk": client.translate("music/volume:DESCRIPTION", null, "uk-UA"),
					"ru": client.translate("music/volume:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addIntegerOption(option => option.setName("int")
					.setDescription(client.translate("common:INT"))
					.setDescriptionLocalizations({
						"uk": client.translate("common:INT", null, "uk-UA"),
						"ru": client.translate("common:INT", null, "ru-RU"),
					})
					.setRequired(true)
					.setAutocomplete(true)),
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
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { ephemeral: true });

		const queue = client.player.nodes.get(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { ephemeral: true });

		const volume = interaction.options.getInteger("int");
		if (volume <= 0 || volume > 100) return interaction.error("misc:INVALID_NUMBER_RANGE", { min: 1, max: 100 });

		queue.node.setVolume(volume);
		interaction.success("music/volume:SUCCESS", {
			volume,
		});
	}

	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").AutocompleteInteraction} interaction
	 * @returns
	 */
	async autocompleteRun(client, interaction) {
		const int = interaction.options.getInteger("int"),
			results = Array.from({ length: 100 }, (_, k) => k + 1).filter(i => i.toString().includes(int));

		return interaction.respond(
			results.slice(0, 25).map(i => ({
				name: i,
				value: i,
			}),
			));
	}
}

module.exports = Volume;