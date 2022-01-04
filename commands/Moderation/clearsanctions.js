const Command = require("../../base/Command.js");

class Clearsanctions extends Command {
	constructor(client) {
		super(client, {
			name: "clearsanctions",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["clearwarns"],
			memberPermissions: ["MANAGE_MESSAGES"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args) {
		const member = await this.client.resolveMember(args[0], message.guild);
		if (!member) return message.error("moderation/clearsanctions:MISSING_MEMBER");

		const memberData = await this.client.findOrCreateMember({
			id: member.id,
			guildID: message.guild.id
		});
		memberData.sanctions = [];
		memberData.save();
		message.success("moderation/clearsanctions:SUCCESS", {
			username: member.user.tag
		});
	}
};

module.exports = Clearsanctions;