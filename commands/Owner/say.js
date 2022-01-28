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
		let sayChannel = null;
		if (message.attachments.size > 0) attachment = message.attachments.first();

		if (!args[1] && !args[2]) {
			if (message.deletable) message.delete();
			sayChannel = message.channel;
			sayChannel.sendTyping();

			setTimeout(function () {
				if (attachment) sayChannel.send({
					content: args[0],
					files: [{
						name: attachment.name,
						attachment: attachment.url
					}]
				});
				else sayChannel.send({
					content: args[0]
				});
			}, 2000);
		} else if (args[1] && !args[2]) {
			if (message.deletable) message.delete();
			sayChannel = message.guild.channels.cache.find(channel => channel.name.includes(args[1]) || channel.id === args[1]);
			sayChannel.sendTyping();

			setTimeout(function () {
				if (attachment) sayChannel.send({
					content: args[0],
					files: [{
						name: attachment.name,
						attachment: attachment.url
					}]
				});
				else sayChannel.send({
					content: args[0]
				});
			}, 2000);
		} else if (args[2]) {
			if (message.deletable) message.delete();
			sayChannel = this.client.guilds.cache.find(guild => guild.name.includes(args[2]) || guild.id === args[2]).channels.cache.find(channel => channel.name.includes(args[1]) || channel.id === args[1]);
			sayChannel.sendTyping();

			setTimeout(function () {
				if (attachment) sayChannel.send({
					content: args[0],
					files: [{
						name: attachment.name,
						attachment: attachment.url
					}]
				});
				else sayChannel.send({
					content: args[0]
				});
			}, 2000);
		}
	}
}

module.exports = Say;