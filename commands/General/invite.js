const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Invite extends Command {
	constructor(client) {
		super(client, {
			name: "invite",
			dirname: __dirname,
			enabled: true,
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
		const donateLink = "https://qiwi.com/n/JONNYBRO/";
		// const voteURL = `https://discordbots.org/bot/${this.client.user.id}/vote`;

		if (args[0] && args[0] === "copy") return message.reply({
			content: inviteLink
		});

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.translate("general/invite:LINKS")
			})
			.setDescription(message.translate("general/invite:TIP", {
				prefix: data.guild.prefix || ""
			}))
			.addField(message.translate("general/invite:ADD"), message.translate("general/invite:CLICK", {
				link: inviteLink
			}))
			.addField(message.translate("general/invite:SUPPORT"), message.translate("general/invite:CLICK", {
				link: donateLink
			}) + `\n*для других способов пишите в ЛС <@${data.config.owner.id}>*`)
			// .addField(message.translate("general/invite:VOTE"), voteURL)
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Invite;