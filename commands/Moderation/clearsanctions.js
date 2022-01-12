const Command = require("../../base/Command.js");

class Clearwarns extends Command {
	constructor(client) {
		super(client, {
			name: "clearwarns",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["clearw", "clw"],
			memberPermissions: ["MANAGE_MESSAGES"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args) {
		const member = await this.client.resolveMember(args[0], message.guild);
		if (!member) return message.error("moderation/clearwarns:MISSING_MEMBER");

		const memberData = await this.client.findOrCreateMember({
			id: member.id,
			guildID: message.guild.id
		});
		memberData.sanctions = [];
		memberData.save();
		message.success("moderation/clearwarns:SUCCESS", {
			username: member.user.tag
		});
	}
}

module.exports = Clearwarns;