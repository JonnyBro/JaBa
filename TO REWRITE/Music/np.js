const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Nowplaying extends Command {
	constructor(client) {
		super(client, {
			name: "nowplaying",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
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

		const track = queue.songs[0];

		const status = queue =>
			`${message.translate("music/np:FILTERS")}: \`${
				queue.filters.join(", ") || message.translate("music/np:DISABLED")
			}\` | ${message.translate("music/np:REPEAT")}: \`${
				queue.repeatMode
					? queue.repeatMode === 2 ? message.translate("music/np:QUEUE") : message.translate("music/np:SONG")
					: message.translate("music/np:DISABLED")
			}\` | ${message.translate("music/np:AUTOPLAY")}: \`${
				queue.autoplay
					? message.translate("music/np:ENABLED")
					: message.translate("music/np:DISABLED")
			}\``;

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.translate("music/queue:TITLE")
			})
			.setThumbnail(track.thumbnail)
			.addFields([
				{
					name: message.translate("music/np:T_TITLE"),
					value: `[${track.name}](${track.url})`
				},
				{
					name: message.translate("music/np:T_CHANNEL"),
					value: track.uploader.name || message.translate("common:UNKNOWN")
				},
				{
					name: message.translate("music/np:T_DURATION"),
					value: `${queue.formattedCurrentTime} / ${track.duration > 1 ? track.formattedDuration : message.translate("music/play:LIVE")}`
				},
				{
					name: message.translate("music/np:T_CONF"),
					value: status(queue)
				}
			])
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			})
			.setTimestamp();

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Nowplaying;