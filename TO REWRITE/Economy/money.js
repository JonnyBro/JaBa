const Command = require("../../base/Command"),
	Discord = require("discord.js");

const asyncForEach = async (collection, callback) => {
	const allPromises = collection.map(async key => {
		await callback(key);
	});

	return await Promise.all(allPromises);
};

class Money extends Command {
	constructor(client) {
		super(client, {
			name: "money",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["balance", "mon"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		let member = await this.client.resolveMember(args[0], message.guild);
		if (!member) member = message.member;
		const user = member.user;

		if (user.bot) return message.error("misc:BOT_USER");

		const memberData = (message.author === user) ? data.memberData : await this.client.findOrCreateMember({
			id: user.id,
			guildID: message.guild.id
		});

		const commonsGuilds = this.client.guilds.cache.filter((g) => g.members.cache.get(user.id));
		let globalMoney = 0;
		await asyncForEach(commonsGuilds, async (guild) => {
			const data = await this.client.findOrCreateMember({
				id: user.id,
				guildID: guild.id
			});
			globalMoney += data.money;
			globalMoney += data.bankSold;
		});

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.translate("economy/money:TITLE", {
					username: member.user.username
				}),
				iconURL: member.user.displayAvatarURL({
					extension: "png",
					size: 512
				})
			})
			.addFields([
				{
					name: message.translate("economy/profile:CASH"),
					value: `**${memberData.money}** ${message.getNoun(memberData.money, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true
				},
				{
					name: message.translate("economy/profile:BANK"),
					value: `**${memberData.bankSold}** ${message.getNoun(memberData.bankSold, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true
				},
				{
					name: message.translate("economy/profile:GLOBAL"),
					value: `**${globalMoney}** ${message.getNoun(globalMoney, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true
				}
			])
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});
		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Money;