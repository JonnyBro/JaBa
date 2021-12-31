const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

const asyncForEach = async (array, callback) => {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	};
};

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
		let globalMoney = 0;
		await asyncForEach(commonsGuilds.array(), async (guild) => {
			const memberData = await this.client.findOrCreateMember({
				id: user.id,
				guildID: guild.id
			});
			globalMoney += memberData.money;
			globalMoney += memberData.bankSold;
		});

		const embed = new Discord.MessageEmbed()
			.setAuthor(message.translate("economy/money:TITLE", {
				username: member.user.username
			}), member.user.displayAvatarURL({
				size: 512,
				dynamic: true,
				format: "png"
			}))
			.addField(message.translate("economy/profile:CASH"), `**${memberData.money}** ${this.client.getNoun(memberData.money, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`, true)
			.addField(message.translate("economy/profile:BANK"), `**${memberData.bankSold}** ${this.client.getNoun(memberData.bankSold, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`, true)
			.addField(message.translate("economy/profile:GLOBAL"), `**${globalMoney}** ${this.client.getNoun(globalMoney, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`, true)
			.setColor(this.client.config.embed.color)
			.setFooter(this.client.config.embed.footer);
		message.channel.send(embed);
	}
};

module.exports = Credits;