const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Seek extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("seek")
				.setDescription(client.translate("music/seek:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("music/seek:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/seek:DESCRIPTION", null, "ru-RU"),
				})
				.addIntegerOption(option =>
					option
						.setName("time")
						.setDescription(client.translate("music/seek:TIME"))
						.setDescriptionLocalizations({
							uk: client.translate("music/seek:TIME", null, "uk-UA"),
							ru: client.translate("music/seek:TIME", null, "ru-RU"),
						})
						.setRequired(true),
				),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		const time = interaction.options.getInteger("time"),
			voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");

		const queue = client.player.nodes.get(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		queue.node.seek(time * 1000);
		interaction.success("music/seek:SUCCESS", {
			time: `**${time}** ${client.functions.getNoun(time, interaction.translate("misc:NOUNS:SECONDS:1"), interaction.translate("misc:NOUNS:SECONDS:2"), interaction.translate("misc:NOUNS:SECONDS:5"))}`,
		});
	}
}

module.exports = Seek;
