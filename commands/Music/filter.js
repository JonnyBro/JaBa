const Command = require("../../base/Command.js")

class Filter extends Command {
	constructor (client) {
		super(client, {
			name: "filter",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [ "f" ],
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

		const filter = args[0];
		if (!filter) return message.error("music/filter:MISSING_FILTER", { prefix: data.guild.prefix });

		if (filter === "off" && queue.filters.length) {
			queue.setFilter(false);
			message.success("music/filter:REMOVING_FILTER");
		} else if (Object.keys(this.client.player.filters).includes(args[0])) {
			queue.setFilter(args[0]);
			message.success("music/filter:ADDING_FILTER");
		} else if (args[0]) return message.error("music/filter:UNKNOWN_FILTER", { prefix: data.guild.prefix });
	}
};

module.exports = Filter;