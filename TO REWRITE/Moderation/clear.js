const Command = require("../../base/Command");

class Clear extends Command {
	constructor(client) {
		super(client, {
			name: "clear",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["cl", "purge"],
			memberPermissions: ["MANAGE_MESSAGES"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_MESSAGES"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args) {
		if (args[0] === "all") {
			message.channel.send(message.translate("moderation/clear:ALL_CONFIRM"));

			const filter = m => m.author.id === message.author.id && m.content === "confirm";
			const collector = message.channel.createMessageCollector({
				filter,
				time: 120000 // 2 minutes
			});

			collector.on("collect", async message => {
				const position = message.channel.position;
				const newChannel = await message.channel.clone();
				await message.channel.delete();
				newChannel.setPosition(position);
				return newChannel.send({
					content: message.translate("moderation/clear:CHANNEL_CLEARED")
				});
			});

			collector.on("end", (_, reason) => {
				if (reason === "time") return message.error("misc:TIMES_UP");
			});
		} else {
			const amount = args[0];
			if (!amount || isNaN(amount) || parseInt(amount) < 1) return message.error("moderation/clear:MISSING_AMOUNT");

			await message.delete();

			const user = message.mentions.users.first();

			let messages = await message.channel.messages.fetch({
				limit: amount
			});
			if (user) messages = messages.filter((m) => m.author.id === user.id);
			if (messages.length > amount) messages.length = parseInt(amount, 10);

			messages = messages.filter((m) => !m.pinned);

			message.channel.bulkDelete(messages, true);

			let toDelete = null;

			if (user) {
				toDelete = await message.channel.send(message.translate("moderation/clear:CLEARED_MEMBER", {
					amount: `${amount} ${message.getNoun(amount, message.translate("misc:NOUNS:MESSAGES:1"), message.translate("misc:NOUNS:MESSAGES:2"), message.translate("misc:NOUNS:MESSAGES:5"))}`,
					username: user.tag
				}));
			} else {
				toDelete = await message.channel.send(message.translate("moderation/clear:CLEARED", {
					amount: `${amount} ${message.getNoun(amount, message.translate("misc:NOUNS:MESSAGES:1"), message.translate("misc:NOUNS:MESSAGES:2"), message.translate("misc:NOUNS:MESSAGES:5"))}`
				}));
			}

			setTimeout(function () {
				toDelete.delete();
			}, 2000);
		}
	}
}

module.exports = Clear;