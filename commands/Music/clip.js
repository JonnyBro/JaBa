const Command = require("../../base/Command"),
	fs = require("fs"),
	{ joinVoiceChannel, createAudioResource, createAudioPlayer, getVoiceConnection } = require("@discordjs/voice");

class Clip extends Command {
	constructor(client) {
		super(client, {
			name: "clip",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args) {
		const voice = message.member.voice.channel;
		const queue = this.client.player.getQueue(message);
		const clip = args[0];

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (getVoiceConnection(message.guild.id)) return message.error("music/clip:ACTIVE_CLIP");
		if (queue) return message.error("music/clip:ACTIVE_QUEUE");
		if (!clip) return message.error("music/clip:NO_ARG");
		if (!fs.existsSync(`./clips/${clip}.mp3`)) return message.error("music/clip:NO_FILE", { file: clip });

		try {
			const connection = joinVoiceChannel({
				channelId: voice.id,
				guildId: message.guild.id,
				adapterCreator: message.guild.voiceAdapterCreator
			});

			const resource = createAudioResource(fs.createReadStream(`./clips/${clip}.mp3`));
			const player = createAudioPlayer()
				.on("error", error => {
					connection.destroy();
					console.error("Error:", error.message, "with track", error.resource.metadata.title);
				});

			player.play(resource);
			connection.subscribe(player);

			setTimeout(() => {
				connection.destroy();
			}, 60 * 1000);
		} catch (error) {
			console.error(error);
		}
	}
}

module.exports = Clip;