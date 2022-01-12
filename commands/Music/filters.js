const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Filters extends Command {
	constructor(client) {
		super(client, {
			name: "filters",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["fs"],
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

		const filtersStatuses = [ [], [] ];

		Object.keys(this.client.player.filters).forEach((filterName) => {
			const array = filtersStatuses[0].length > filtersStatuses[1].length ? filtersStatuses[1] : filtersStatuses[0];
			array.push(`${filterName}: ${(queue.filters[filterName] ? this.client.customEmojis.success : this.client.customEmojis.error)}`);
		});

		const list = new Discord.MessageEmbed()
			.setDescription(message.translate("music/filters:CONTENT", {
				prefix: data.guild.prefix
			}))
			.addField(message.translate("music/filters:TITLE"), filtersStatuses[0].join("\n"), true)
			.addField("** **", filtersStatuses[1].join("\n"), true)
			.setColor(data.config.embed.color);

		message.channel.send({
			embeds: [list]
		});
	}
}

module.exports = Filters;