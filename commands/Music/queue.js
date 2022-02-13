const Command = require("../../base/Command"),
	Discord = require("discord.js"),
	Pagination = require("discord-paginationembed");

class Queue extends Command {
	constructor(client) {
		super(client, {
			name: "queue",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["qu"],
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

		if (queue.songs.length === 1) {
			const embed = new Discord.MessageEmbed()
				.setAuthor({
					name: message.translate("music/queue:TITLE"),
					iconURL: message.guild.iconURL({
						dynamic: true
					})
				})
				.addField(message.translate("music/np:CURRENTLY_PLAYING"), `[${queue.songs[0].name}](${queue.songs[0].url})\n*Добавил ${queue.songs[0].member}*\n`)
				.setColor(data.config.embed.color);
			return message.reply({
				embeds: [embed]
			});
		}

		const FieldsEmbed = new Pagination.FieldsEmbed();

		FieldsEmbed.embed
			.setColor(data.config.embed.color)
			.setAuthor({
				name: message.translate("music/queue:TITLE"),
				iconURL: message.guild.iconURL({
					dynamic: true
				})
			})
			.addField(message.translate("music/np:CURRENTLY_PLAYING"), `[${queue.songs[0].name}](${queue.songs[0].url})\n*Добавил ${queue.songs[0].member}*\n`);

		FieldsEmbed
			.setArray(queue.songs[1] ? queue.songs.slice(1, queue.songs.length) : [])
			.setAuthorizedUsers([message.author.id])
			.setChannel(message.channel)
			.setElementsPerPage(5)
			.setDeleteOnTimeout(true)
			.setDisabledNavigationEmojis(["jump"])
			.setPageIndicator(true)
			.formatField("Очередь", (track) => `**${queue.songs.indexOf(track)}**. [${track.name}](${track.url})\n*Добавил ${track.member}*\n`)
			.build();
	}
}

module.exports = Queue;