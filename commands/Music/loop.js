const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder } = require("discord.js"),
	{ QueueRepeatMode } = require("../../helpers/Music/dist/index");
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
				.setDescription(client.translate("music/loop:DESCRIPTION")),
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
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		const queue = client.player.getQueue(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		const row = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId("loop_select")
					.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
					.addOptions([
						{
							label: client.translate("music/loop:AUTOPLAY"),
							value: "3"
						},
						{
							label: client.translate("music/loop:QUEUE"),
							value: "2"
						},
						{
							label: client.translate("music/loop:TRACK"),
							value: "1"
						},
						{
							label: client.translate("music/loop:DISABLE"),
							value: "0"
						}
					])
			);

		await interaction.editReply({
			content: interaction.translate("common:AVAILABLE_OPTIONS"),
			components: [row]
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (15 * 1000) });

		collector.on("collect", async i => {
			if (i.isSelectMenu() && i.customId === "loop_select") {
				const type = i?.values[0];
				const mode = type === "3" ? QueueRepeatMode.AUTOPLAY :
					type === "2" ? QueueRepeatMode.QUEUE :
						type === "1" ? QueueRepeatMode.TRACK : QueueRepeatMode.OFF;

				queue.setRepeatMode(mode);
				return interaction.editReply({
					content: interaction.translate(`music/loop:${
						type === "3" ? "AUTOPLAY_ENABLED" :
							type === "2" ? "QUEUE_ENABLED" :
								type === "1" ? "TRACK_ENABLED" : "LOOP_DISABLED"
					}`),
					components: []
				});
			}
		});
	}
}

module.exports = Loop;