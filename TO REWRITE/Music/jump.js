const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Jump extends Command {
	constructor(client) {
		super(client, {
			name: "jump",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["j"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args, data) {
		const queue = this.client.player.getQueue(message);
		const voice = message.member.voice.channel;
		const number = parseInt(args[0]);

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return message.error("music/play:NOT_PLAYING");
		if (number < 0) return message.error("music/jump:NO_PREV_SONG", { prefix: data.guild.prefix });

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.translate("music/jump:SUCCESS")
			})
			.setThumbnail(queue.songs[number].thumbnail)
			.setFooter({
				text: data.config.embed.footer
			})
			.setColor(data.config.embed.color);

		const m = await message.reply({
			embeds: [embed]
		});

		this.client.player.jump(message, number);
		embed.setDescription(message.translate("music/play:NOW_PLAYING", {
			songName: queue.songs[number].name
		}));
		m.edit({
			embeds: [embed]
		});
	}
}

module.exports = Jump;