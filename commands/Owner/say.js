const Command = require("../../base/Command");

class Say extends Command {
	constructor(client) {
		super(client, {
			name: "say",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: [],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES"],
			nsfw: false,
			ownerOnly: true,
			cooldown: 2000
		});
	}

	async run(message, args) {
		if (!args[0]) {
			if (message.deletable) return message.delete();
		}

		// Arguments split
		const split = "++";
		args = args.join(" ").split(split);
		for (let i = 0; i < args.length; i++) args[i] = args[i].trim();

		let attachment = null;
		if (message.attachments.size > 0) attachment = message.attachments.first();

		if (!args[1] && !args[2]) {
			if (message.deletable) message.delete();
			const saychannel = message.channel;
			saychannel.sendTyping();

			setTimeout(function () {
				if (attachment) saychannel.send({
					content: args[0],
					files: [{
						name: attachment.name,
						attachment: attachment.url
					}]
				});
				else saychannel.send({
					content: args[0]
				});
			}, 2000);
		} else if (args[1] && !args[2]) {
			if (message.deletable) message.delete();
			const saychannel = message.guild.channels.cache.find(channel => channel.name == args[1] || channel.id == args[1]);
			saychannel.sendTyping();

			setTimeout(function () {
				if (attachment) saychannel.send({
					content: args[0],
					files: [{
						name: attachment.name,
						attachment: attachment.url
					}]
				});
				else saychannel.send({
					content: args[0]
				});
			}, 2000);
		} else if (args[2]) {
			if (message.deletable) message.delete();
			const saychannel = this.client.guilds.cache.find(guild => guild.name == args[2] || guild.id == args[2]).channels.cache.find(channel => channel.name == args[1] || channel.id == args[1]);
			saychannel.sendTyping();

			setTimeout(function () {
				if (attachment) saychannel.send({
					content: args[0],
					files: [{
						name: attachment.name,
						attachment: attachment.url
					}]
				});
				else saychannel.send({
					content: args[0]
				});
			}, 2000);
		}
	}
}

module.exports = Say;