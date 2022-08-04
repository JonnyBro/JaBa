const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Achievements extends Command {
	constructor(client) {
		super(client, {
			name: "achievements",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["ac"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		let member = message.guild ? message.member : message.author;
		if (args[0]) member = await this.client.resolveMember(args[0], message.guild);
		if (message.guild && member.user.bot) return message.error("economy/profile:BOT_USER");

		const userData = (member.id === message.author.id ? data.userData : await this.client.findOrCreateUser({
			id: member.id
		}));

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.translate("economy/achievements:TITLE")
			})
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		embed.addFields([
			{
				name: message.translate("economy/achievements:SEND_CMD"),
				value: message.translate("economy/achievements:PROGRESS", {
					now: userData.achievements.firstCommand.progress.now,
					total: userData.achievements.firstCommand.progress.total,
					percent: Math.round(100 * (userData.achievements.firstCommand.progress.now / userData.achievements.firstCommand.progress.total))
				})
			},
			{
				name: message.translate("economy/achievements:CLAIM_SALARY"),
				value: message.translate("economy/achievements:PROGRESS", {
					now: userData.achievements.work.progress.now,
					total: userData.achievements.work.progress.total,
					percent: Math.round(100 * (userData.achievements.work.progress.now / userData.achievements.work.progress.total))
				})
			},
			{
				name: message.translate("economy/achievements:MARRY"),
				value: message.translate("economy/achievements:PROGRESS", {
					now: userData.achievements.married.progress.now,
					total: userData.achievements.married.progress.total,
					percent: Math.round(100 * (userData.achievements.married.progress.now / userData.achievements.married.progress.total))
				})
			},
			{
				name: message.translate("economy/achievements:SLOTS"),
				value: message.translate("economy/achievements:PROGRESS", {
					now: userData.achievements.slots.progress.now,
					total: userData.achievements.slots.progress.total,
					percent: Math.round(100 * (userData.achievements.slots.progress.now / userData.achievements.slots.progress.total))
				})
			},
			{
				name: message.translate("economy/achievements:TIP"),
				value: message.translate("economy/achievements:PROGRESS", {
					now: userData.achievements.tip.progress.now,
					total: userData.achievements.tip.progress.total,
					percent: Math.round(100 * (userData.achievements.tip.progress.now / userData.achievements.tip.progress.total))
				})
			},
			{
				name: message.translate("economy/achievements:REP"),
				value: message.translate("economy/achievements:PROGRESS", {
					now: userData.achievements.rep.progress.now,
					total: userData.achievements.rep.progress.total,
					percent: Math.round(100 * (userData.achievements.rep.progress.now / userData.achievements.rep.progress.total))
				})
			},
			{
				name: message.translate("economy/achievements:INVITE"),
				value: message.translate("economy/achievements:PROGRESS", {
					now: userData.achievements.invite.progress.now,
					total: userData.achievements.invite.progress.total,
					percent: Math.round(100 * (userData.achievements.invite.progress.now / userData.achievements.invite.progress.total))
				})
			}
		]);

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Achievements;