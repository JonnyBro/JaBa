const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

// const asyncForEach = async (array, callback) => {
// 	for (let index = 0; index < array.size; index++) {
// 		await callback(index, array);
// 	};
// };

class Credits extends Command {
	constructor(client) {
		super(client, {
			name: "money",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["credits", "balance", "mon"],
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
		const globalMoney = memberData.money + memberData.bankSold;
		// let globalMoney = 0;
		// await asyncForEach(commonsGuilds, async (guild) => {
		// 	const memberData = await this.client.findOrCreateMember({
		// 		id: user.id,
		// 		guildID: guild.id
		// 	});
		// 	globalMoney += memberData.money;
		// 	globalMoney += memberData.bankSold;
		// });

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.translate("economy/money:TITLE", {
					username: member.user.username
				}),
				iconURL: member.user.displayAvatarURL({
					size: 512,
					dynamic: true,
					format: "png"
				})
			})
			.addField(message.translate("economy/profile:CASH"), `**${memberData.money}** ${message.getNoun(memberData.money, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`, true)
			.addField(message.translate("economy/profile:BANK"), `**${memberData.bankSold}** ${message.getNoun(memberData.bankSold, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`, true)
			.addField(message.translate("economy/profile:GLOBAL"), `**${globalMoney}** ${message.getNoun(globalMoney, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`, true)
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});
		message.channel.send({
			embeds: [embed]
		});
	}
};

module.exports = Credits;