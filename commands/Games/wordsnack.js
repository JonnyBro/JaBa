const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Wordsnack extends Command {
	constructor (client) {
		super(client, {
			name: "wordsnack",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000
		});
	}

	async run (message, args, data) {
		const voice = message.member.voice.channel;
		if (!voice) return message.error("music/play:NO_VOICE_CHANNEL");

		const perms = voice.permissionsFor(this.client.user);
		if (!perms.has("CONNECT") || !perms.has("SPEAK")) return message.error("music/play:VOICE_CHANNEL_CONNECT");

		this.client.discordTogether.createTogetherCode(message.member.voice.channelID, "wordsnack").then(async invite => {
			const embed = new Discord.MessageEmbed()
				.setTitle("Words Snack")
				.setColor(data.config.embed.color)
				.setDescription(`**[${message.translate("misc:CLICK_HERE", { activity: "Words Snack", channel: voice.name })}](${invite.code})**`)
				.setFooter(data.config.embed.footer)
				.setTimestamp()
			return message.channel.send(embed);
		});
	}
};

module.exports = Wordsnack;