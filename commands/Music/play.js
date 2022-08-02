const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Play extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("play")
				.setDescription(client.translate("music/play:DESCRIPTION"))
				.addStringOption(option => option.setName("link")
					.setDescription(client.translate("music/play:LINK"))
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
		await interaction.deferReply();

		const voice = interaction.member.voice.channel;
		const link = interaction.options.getString("link");
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");

		const perms = voice.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT");

		try {
			client.player.play(interaction.member.voice.channel, link, {
				member: interaction.member,
				textChannel: interaction.channel
			});

			interaction.editReply({
				content: interaction.translate("music/play:ADDED_QUEUE", { songName: link })
			});
		} catch (e) {
			interaction.error("music/play:ERR_OCCURRED", {
				error: e
			});
			console.error(e);
		}
	}
}

module.exports = Play;