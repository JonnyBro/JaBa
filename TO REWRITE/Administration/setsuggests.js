const Command = require("../../base/Command");

class Setsuggests extends Command {
	constructor(client) {
		super(client, {
			name: "setsuggests",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["setsu"],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const areSuggestsEnabled = Boolean(data.guild.plugins.suggestions);
		const sentChannel = await Resolvers.resolveChannel({
			message,
			search: args.join(" "),
			channelType: "GUILD_TEXT"
		});

		if (!sentChannel && areSuggestsEnabled) {
			data.guild.plugins.suggestions = null;
			data.guild.markModified("plugins.suggestions");
			await data.guild.save();
			return message.success("administration/setsuggests:DISABLED");
		} else {
			const channel = sentChannel || message.channel;
			data.guild.plugins.suggestions = channel.id;
			data.guild.markModified("plugins.suggestions");
			await data.guild.save();
			return message.success("administration/setsuggests:ENABLED", {
				channel: channel.toString()
			});
		}
	}
}

module.exports = Setsuggests;