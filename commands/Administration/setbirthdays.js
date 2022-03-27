const Command = require("../../base/Command"),
	Resolvers = require("../../helpers/resolvers");

class Setbirthdays extends Command {
	constructor(client) {
		super(client, {
			name: "setbirthdays",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["setb"],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const areBirthdaysEnabled = Boolean(data.guild.plugins.birthdays);
		const sentChannel = await Resolvers.resolveChannel({
			message,
			search: args.join(" "),
			channelType: "GUILD_TEXT"
		});

		if (!sentChannel && areBirthdaysEnabled) {
			data.guild.plugins.birthdays = null;
			data.guild.markModified("plugins.birthdays");
			await data.guild.save();
			return message.success("administration/setbirthdays:DISABLED");
		} else {
			const channel = sentChannel || message.channel;
			data.guild.plugins.birthdays = channel.id;
			data.guild.markModified("plugins.birthdays");
			await data.guild.save();
			return message.success("administration/setbirthdays:ENABLED", {
				channel: channel.toString()
			});
		}
	}
}

module.exports = Setbirthdays;