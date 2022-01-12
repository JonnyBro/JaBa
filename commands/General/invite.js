const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Invite extends Command {
	constructor(client) {
		super(client, {
			name: "invite",
			dirname: __dirname,
			enabled: false,
			guildOnly: false,
			aliases: ["i", "add", "vote"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const inviteLink = this.client.generateInvite({
			scopes: ["bot"],
			permissions: [Discord.Permissions.FLAGS.ADMINISTRATOR]
		});
		const voteURL = `https://discordbots.org/bot/${this.client.user.id}/vote`;
		const supportURL = await this.client.functions.supportLink(this.client);

		if (args[0] && args[0] === "copy") return message.channel.send({
			content: inviteLink
		});

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.translate("general/invite:LINKS")
			})
			.setDescription(message.translate("general/invite:TIP", {
				prefix: data.guild.prefix || ""
			}))
			.addField(message.translate("general/invite:ADD"), inviteLink)
			.addField(message.translate("general/invite:VOTE"), voteURL)
			.addField(message.translate("general/invite:SUPPORT"), supportURL)
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		message.channel.send({
			embeds: [embed]
		});
	}
}

module.exports = Invite;