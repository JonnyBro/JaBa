const Command = require("../../base/Command.js");

class Say extends Command {
	constructor (client) {
		super(client, {
			name: "say",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: [],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: true,
			cooldown: 3000
		});
	}

	async run (message, args, data) {
		// Arguments split
		let split = "++";
		args = args.join(" ").split(split);
		for (var i = 0; i < args.length; i++) args[i] = args[i].trim();

		if (!args[0]) return message.delete();

		if (args[1] && !args[2]) {
			message.delete();
			const saychannel = message.guild.channels.cache.find(channel => channel.name == args[1] || channel.id == args[1]);
			saychannel.startTyping();

			setTimeout(function() {
				saychannel.send(args[0]);
				saychannel.stopTyping();
			}, 2000);
		} else if (args[2]) {
			const saychannel = this.client.guilds.cache.find(guild => guild.name == args[2] || guild.id == args[2]).channels.cache.find(channel => channel.name == args[1] || channel.id == args[1]);
			saychannel.startTyping();

			setTimeout(function() {
				saychannel.send(args[0]);
				saychannel.stopTyping();
			}, 2000);
		} else {
			message.delete();
			const saychannel = message.channel;
			saychannel.startTyping();

			setTimeout(function() {
				saychannel.send(args[0]);
				saychannel.stopTyping();
			}, 2000);
		};
	}
};

module.exports = Say;