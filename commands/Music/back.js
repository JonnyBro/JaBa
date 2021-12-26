const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Back extends Command {
	constructor(client) {
		super(client, {
			name: "back",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["previous"],
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
		if (!queue.previousSongs[0]) return message.error("music/back:NO_PREV_SONG");

		const embed = new Discord.MessageEmbed()
			.setAuthor(message.translate("music/back:DESCRIPTION"))
			.setThumbnail(queue.tracks[0].thumbnail)
			.setFooter(data.config.embed.footer)
			.setColor(data.config.embed.color);

		const m = await message.channel.send(embed);

		this.client.player.previous(message);
		embed.setDescription(message.translate("music/back:SUCCESS"));
		m.edit(embed);
	}
};

module.exports = Back;