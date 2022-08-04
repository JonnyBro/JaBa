const Command = require("../../base/Command");

class Setnews extends Command {
	constructor(client) {
		super(client, {
			name: "setnews",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const areNewsEnabled = Boolean(data.guild.plugins.news);
		const sentChannel = await Resolvers.resolveChannel({
			message,
			search: args.join(" "),
			channelType: "GUILD_TEXT"
		});

		if (areNewsEnabled && !sentChannel) {
			data.guild.plugins.news = null;
			data.guild.markModified("plugins.news");
			await data.guild.save();
			return message.success("administration/setnews:DISABLED");
		} else {
			const channel = sentChannel || message.channel;
			data.guild.plugins.news = channel.id;
			data.guild.markModified("plugins.news");
			await data.guild.save();
			return message.success("administration/setnews:ENABLED", {
				channel: channel.toString()
			});
		}
	}
}

module.exports = Setnews;