const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Np extends Command {
	constructor (client) {
		super(client, {
			name: "np",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [ "nowplaying", "now-playing" ],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run (message, args, data) {
		const voice = message.member.voice.channel;
		const queue = this.client.player.getQueue(message);

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return message.error("music/play:NOT_PLAYING");

		// Gets the current song
		const track = queue.songs[0];

		// Generate discord embed to display song informations
		const embed = new Discord.MessageEmbed()
			.setAuthor(message.translate("music/queue:TITLE"))
			.setThumbnail(track.thumbnail)
			.addField(message.translate("music/np:T_TITLE"), track.name + `\n${track.url}`)
			.addField(message.translate("music/np:T_CHANNEL"), track.uploader.name)
			.addField(message.translate("music/np:T_DURATION"), message.convertTime(Date.now() + track.duration * 1000, "to", true))
			.setColor(data.config.embed.color)
			.setFooter(data.config.embed.footer)
			.setTimestamp();

		// Send the embed in the current channel
		message.channel.send(embed);
	}
};

module.exports = Np;