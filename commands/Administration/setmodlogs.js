const Command = require("../../base/Command.js"),
	Resolvers = require("../../helpers/resolvers");

class Setmodlogs extends Command {
	constructor(client) {
		super(client, {
			name: "setmodlogs",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["setm"],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const areModLogsEnabled = Boolean(data.guild.plugins.modlogs);
		const sentChannel = await Resolvers.resolveChannel({
			message,
			search: args.join(" "),
			channelType: "text"
		});

		if (!sentChannel && areModLogsEnabled) {
			data.guild.plugins.modlogs = null;
			data.guild.markModified("plugins.modlogs");
			await data.guild.save();
			return message.success("administration/setmodlogs:DISABLED");
		} else {
			const channel = sentChannel || message.channel;
			data.guild.plugins.modlogs = channel.id;
			data.guild.markModified("plugins.modlogs");
			await data.guild.save();
			return message.success("administration/setmodlogs:ENABLED", {
				channel: channel.toString()
			});
		};
	}
};

module.exports = Setmodlogs;