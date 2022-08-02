const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	ms = require("ms");

class Seek extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("seek")
				.setDescription(client.translate("music/seek:DESCRIPTION"))
				.addStringOption(option => option.setName("time")
					.setDescription("music/seek:TIME")
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
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const voice = interaction.member.voice.channel;
		const queue = client.player.getQueue(interaction);
		const time = ms(interaction.options.getString("time")) / 1000;

		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return interaction.error("music/play:NOT_PLAYING");
		if (isNaN(time)) return interaction.error("music/seek:INVALID_TIME");

		await client.player.seek(interaction, time);

		interaction.replyT("music/seek:SUCCESS", {
			time: ms(interaction.options.getString("time"))
		});
	}
}

module.exports = Seek;