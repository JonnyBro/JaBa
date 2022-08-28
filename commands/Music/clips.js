const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, } = require("discord.js"),
	{ joinVoiceChannel, createAudioResource, createAudioPlayer, getVoiceConnection, AudioPlayerStatus } = require("@discordjs/voice");
const BaseCommand = require("../../base/BaseCommand"),
	fs = require("fs");

class Clips extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("clips")
				.setDescription(client.translate("music/clips:DESCRIPTION")),
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
		fs.readdir("./clips", async function (err, files) {
			await interaction.deferReply();

			if (err) return console.log("Unable to read directory: " + err);

			const clips = files.map(file => {
				const fileName = file.substring(0, file.length - 4);
				return {
					label: fileName,
					value: fileName
				};
			});

			const row = new ActionRowBuilder()
				.addComponents(
					new SelectMenuBuilder()
						.setCustomId("clips_select")
						.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
						.addOptions(clips)
				);

			await interaction.editReply({
				content: interaction.translate("music/clips:AVAILABLE_CLIPS"),
				components: [row]
			});

			const filter = i => i.user.id === interaction.user.id;
			const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (15 * 1000) });

			collector.on("collect", async i => {
				if (i.isSelectMenu() && i.customId === "clips_select") {
					const clip = i?.values[0];
					const voice = i.member.voice.channel;
					if (!voice) return i.update({ content: interaction.translate("music/play:NO_VOICE_CHANNEL"), components: [] });
					const queue = client.player.getQueue(i.guild.id);
					if (queue) return i.update({ content: interaction.translate("music/clips:ACTIVE_QUEUE"), components: [] });
					if (getVoiceConnection(i.guild.id)) return i.update({ content: interaction.translate("music/clips:ACTIVE_CLIP"), components: [] });
					if (!fs.existsSync(`./clips/${clip}.mp3`)) return i.update({ content: interaction.translate("music/clips:NO_FILE", { file: clip }), components: [] });

					try {
						const connection = joinVoiceChannel({
							channelId: voice.id,
							guildId: interaction.guild.id,
							adapterCreator: interaction.guild.voiceAdapterCreator
						});

						const resource = createAudioResource(fs.createReadStream(`./clips/${clip}.mp3`));
						const player = createAudioPlayer()
							.on("error", err => {
								connection.destroy();
								console.error(err.message);
							});

						player.play(resource);
						connection.subscribe(player);

						player.on(AudioPlayerStatus.Idle, () => {
							connection.destroy();
						});
					} catch (error) {
						console.error(error);
					}

					await interaction.editReply({
						content: interaction.translate("music/clips:PLAYING", {
							clip
						}),
						components: []
					});
				}
			});

			collector.on("end", () => {
				return interaction.editReply({
					components: []
				});
			});
		});
	}
}

module.exports = Clips;