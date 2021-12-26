const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Stop extends Command {
	constructor(client) {
		super(client, {
			name: "stop",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["leave"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args, data) {
		const voice = message.member.voice.channel;
		const queue = await this.client.player.getQueue(message);

		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");
		if (!queue) return message.error("music/play:NOT_PLAYING");

		const embed = new Discord.MessageEmbed()
			.setAuthor(message.translate("music/stop:DESCRIPTION"))
			.setFooter(data.config.embed.footer)
			.setColor(data.config.embed.color);

		const m = await message.channel.send(embed);

		this.client.player.stop(message);
		embed.setDescription(message.translate("music/stop:SUCCESS"));
		m.edit(embed);
	}
};

module.exports = Stop;