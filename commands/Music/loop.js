const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, InteractionCollector, ComponentType } = require("discord.js");
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
		const queue = client.player.getQueue(interaction);

		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return interaction.error("music/play:NOT_PLAYING");

		const row = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId("nsfw_select")
					.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
					.addOptions([
						{
							label: client.translate("music/loop:QUEUE"),
							value: "queue"
						},
						{
							label: client.translate("music/loop:SONG"),
							value: "song"
						}
					])
			);

		const msg = await interaction.reply({
			content: interaction.translate("common:AVAILABLE_CATEGORIES"),
			ephemeral: true,
			components: [row],
			fetchReply: true
		});

		const collector = new InteractionCollector(client, {
			componentType: ComponentType.SelectMenu,
			message: msg,
			idle: 60 * 1000
		});

		collector.on("collect", async msg => {
			const type = msg?.values[0];
			let mode = null;

			if (type === "queue") {
				mode = client.player.setRepeatMode(interaction, 2);
			} else if (type === "song") {
				mode = client.player.setRepeatMode(interaction, 1);
			} else {
				mode = client.player.setRepeatMode(interaction, 0);
			}

			await msg.update({
				content: `music/loop:${mode ? mode === 2 ? "QUEUE_ENABLED" : "SONG_ENABLED" : "DISABLED"}`,
				components: []
			});
		});
	}
}

module.exports = Loop;