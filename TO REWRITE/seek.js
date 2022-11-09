const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

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
				.addIntegerOption(option => option.setName("time")
					.setDescription(client.translate("music/seek:TIME"))
					.setRequired(true)),
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
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");
		const time = interaction.options.getInteger("time");

		queue.seek(time)
			.then(() => interaction.replyT("music/seek:SUCCESS", { time: `${time} ${client.getNoun(time, interaction.translate("misc:NOUNS:SECONDS:1"), interaction.translate("misc:NOUNS:SECONDS:2"), interaction.translate("misc:NOUNS:SECONDS:5"))}` }));
	}
}

module.exports = Seek;