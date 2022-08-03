const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, InteractionCollector, ComponentType } = require("discord.js"),
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
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		fs.readdir("./clips", async function (err, files) {
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

			const msg = await interaction.reply({
				content: interaction.translate("music/clips:AVAILABLE_CLIPS"),
				components: [row],
				fetchReply: true
			});

			const collector = new InteractionCollector(client, {
				componentType: ComponentType.SelectMenu,
				message: msg,
				idle: 60 * 1000
			});

			collector.on("collect", async msg => {
				const clip = msg?.values[0];
				const voice = msg.member.voice.channel;
				if (!voice) return msg.update({ content: interaction.translate("music/play:NO_VOICE_CHANNEL"), components: [] });
				const queue = client.player.getQueue(msg.guild.id);
				if (queue) return msg.update({ content: interaction.translate("music/clips:ACTIVE_QUEUE"), components: [] });
				if (getVoiceConnection(msg.guild.id)) return msg.update({ content: interaction.translate("music/clips:ACTIVE_CLIP"), components: [] });
				if (!fs.existsSync(`./clips/${clip}.mp3`)) return msg.update({ content: interaction.translate("music/clips:NO_FILE", { file: clip }), components: [] });

				try {
					const connection = joinVoiceChannel({
						channelId: voice.id,
						guildId: msg.guild.id,
						adapterCreator: msg.guild.voiceAdapterCreator
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

				await msg.update({
					content: interaction.translate("music/clips:PLAYING", {
						clip
					}),
					components: []
				});
			});
		});
	}
}

module.exports = Clips;