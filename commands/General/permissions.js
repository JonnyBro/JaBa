const Command = require("../../base/Command"),
	Discord = require("discord.js");

const permissions = Object.keys(Discord.Permissions.FLAGS);

class Permissions extends Command {
	constructor(client) {
		super(client, {
			name: "permissions",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["perms"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message) {
		const member = message.mentions.members.first() || message.member;
		const mPermissions = message.channel.permissionsFor(member);
		const total = {
			denied: 0,
			allowed: 0
		};

		let text = `${message.translate("general/permissions:TITLE", { user: member.user.username, channel: message.channel.name })}\n\n`;
		permissions.forEach((perm) => {
			if (perm === "REQUEST_TO_SPEAK") return;

			if (!mPermissions.has(perm)) {
				text += `${message.translate(`misc:PERMISSIONS:${perm}`)} ❌\n`;
				total.denied++;
			} else {
				text += `${message.translate(`misc:PERMISSIONS:${perm}`)} ✅\n`;
				total.allowed++;
			}
		});
		text += `\n${total.allowed} ✅ | ${total.denied} ❌`;

		message.channel.send({
			content: text
		});
	}
}

module.exports = Permissions;