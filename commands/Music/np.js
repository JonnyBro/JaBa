const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Np extends Command {
	constructor(client) {
		super(client, {
			name: "np",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["nowplaying"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args, data) {
		const voice = message.member.voice.channel;
		const queue = this.client.player.getQueue(message);

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return message.error("music/play:NOT_PLAYING");

		// Gets the current song
		const track = queue.songs[0];

		const status = queue =>
			`Фильтры: \`${queue.filters.join(", ")
				|| "Выкл"}\` | Повтор: \`${
				queue.repeatMode
					? queue.repeatMode === 2
						? "Очереди"
						: "Текущей песни"
					: "Выкл"
			}\` | Автовоспроизведение: \`${queue.autoplay ? "Вкл" : "Выкл"}\``;

		// Generate discord embed to display song informations
		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.translate("music/queue:TITLE")
			})
			.setThumbnail(track.thumbnail)
			.addField(message.translate("music/np:T_TITLE"), `[${track.name}](${track.url})`)
			.addField(message.translate("music/np:T_CHANNEL"), track.uploader.name ? track.uploader.name : "Отсутствует")
			.addField(message.translate("music/np:T_DURATION"), `${queue.formattedCurrentTime} / ${track.formattedDuration}`)
			.addField(message.translate("music/np:T_CONF"), status(queue))
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			})
			.setTimestamp();

		// Send the embed in the current channel
		message.channel.send({
			embeds: [embed]
		});
	}
};

module.exports = Np;