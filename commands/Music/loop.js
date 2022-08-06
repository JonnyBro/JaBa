const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, InteractionCollector, ComponentType } = require("discord.js"),
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
	 * @param {Array} data
	 */
	async execute(client, interaction) {
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
							value: QueueRepeatMode.AUTOPLAY.toString()
						},
						{
							label: client.translate("music/loop:QUEUE"),
							value: QueueRepeatMode.QUEUE.toString()
						},
						{
							label: client.translate("music/loop:TRACK"),
							value: QueueRepeatMode.TRACK.toString()
						},
						{
							label: client.translate("music/loop:DISABLE"),
							value: QueueRepeatMode.OFF.toString()
						}
					])
			);

		const msg = await interaction.reply({
			content: interaction.translate("common:AVAILABLE_CATEGORIES"),
			components: [row],
			fetchReply: true
		});

		const collector = new InteractionCollector(client, {
			componentType: ComponentType.SelectMenu,
			message: msg,
			idle: 60 * 1000
		});

		collector.on("collect", async i => {
			const type = QueueRepeatMode[msg?.values[0]];
			queue.setRepeatMode(type);
			i.update({
				content: interaction.translate(`music/loop:${type === QueueRepeatMode.AUTOPLAY ? "AUTOPLAY_ENABLED" :
					type === QueueRepeatMode.QUEUE ? "QUEUE_ENABLED" : type === QueueRepeatMode.TRACK ? "TRACK_ENABLED" : "LOOP_DISABLED"}`),
				components: []
			});
		});
	}
}

module.exports = Loop;