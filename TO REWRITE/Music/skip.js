const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Skip extends Command {
	constructor(client) {
		super(client, {
			name: "skip",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["s"],
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
		if (!queue.songs[1]) return message.error("music/skip:NO_NEXT_SONG");

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.translate("music/skip:SUCCESS")
			})
			.setThumbnail(queue.songs[1].thumbnail)
			.setFooter({
				text: data.config.embed.footer
			})
			.setColor(data.config.embed.color);

		const m = await message.reply({
			embeds: [embed]
		});

		this.client.player.skip(message);
		embed.setDescription(message.translate("music/play:NOW_PLAYING", {
			songName: queue.songs[1].name
		}));
		m.edit({
			embeds: [embed]
		});
	}
}

module.exports = Skip;