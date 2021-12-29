const Command = require("../../base/Command.js"),
	Resolvers = require("../../helpers/resolvers");

class Setbirthdays extends Command {
	constructor(client) {
		super(client, {
			name: "setbirthdays",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const areBirthdaysEnabled = Boolean(data.guild.plugins.birthdays);
		const sentChannel = await Resolvers.resolveChannel({
			message,
			search: args.join(" "),
			channelType: "text"
		});

		if (!sentChannel && areBirthdaysEnabled) {
			data.guild.plugins.birthdays = null;
			data.guild.markModified("plugins.birthdays");
			await data.guild.save();
			return message.success("administration/setbirthdays:SUCCESS_DISABLED");
		} else {
			const channel = sentChannel || message.channel;
			data.guild.plugins.birthdays = channel.id;
			data.guild.markModified("plugins.birthdays");
			await data.guild.save();
			return message.success("administration/setbirthdays:SUCCESS_ENABLED", {
				channel: channel.toString()
			});
		};
	}
};

module.exports = Setbirthdays;