const Command = require("../../base/Command"),
	Discord = require("discord.js");

const asyncForEach = async (collection, callback) => {
	const allPromises = collection.map(async key => {
		await callback(key);
	});

	return await Promise.all(allPromises);
};

class Profile extends Command {
	constructor(client) {
		super(client, {
			name: "profile",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["prof"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const arg = args[0] || message.author;
		let member = await this.client.resolveMember(arg, message.guild);
		if (!member) member = message.member;
		if (member.user.bot) return message.error("economy/profile:BOT_USER");

		const memberData = (member.id === message.author.id ? data.memberData : await this.client.findOrCreateMember({
			id: member.id,
			guildID: message.guild.id
		}));
		const userData = (member.id === message.author.id ? data.userData : await this.client.findOrCreateUser({
			id: member.id
		}));
		if (userData.lover && !this.client.users.cache.get(userData.lover)) await this.client.users.fetch(userData.lover, true);

		const commonsGuilds = this.client.guilds.cache.filter((g) => g.members.cache.get(member.id));
		let globalMoney = 0;
		await asyncForEach(commonsGuilds, async (guild) => {
			const data = await this.client.findOrCreateMember({
				id: member.id,
				guildID: guild.id
			});
			globalMoney += data.money;
			globalMoney += data.bankSold;
		});

		const profileEmbed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.translate("economy/profile:TITLE", {
					username: member.user.tag
				}),
				iconURL: member.user.displayAvatarURL({
					extension: "png",
					size: 512
				})
			})
			.setImage("attachment://achievements.png")
			.addFields([
				{
					name: this.client.customEmojis.link + " " + message.translate("economy/profile:LINK"),
					value: `[${message.translate("economy/profile:LINK_TEXT")}](${this.client.config.dashboard.baseURL}/user/${member.user.id}/${message.guild.id})`
				},
				{
					name: message.translate("economy/profile:BIO"),
					value: userData.bio ? userData.bio : message.translate("economy/profile:NO_BIO")
				},
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
				},
				{
					name: message.translate("economy/profile:REPUTATION"),
					value: `**${userData.rep}** ${message.getNoun(userData.rep, message.translate("misc:NOUNS:POINTS:1"), message.translate("misc:NOUNS:POINTS:2"), message.translate("misc:NOUNS:POINTS:5"))}`,
					inline: true
				},
				{
					name: message.translate("economy/profile:LEVEL"),
					value:`**${memberData.level}**`,
					inline: true
				},
				{
					name: message.translate("economy/profile:EXP"),
					value: `**${memberData.exp}/${5 * (memberData.level * memberData.level) + 80 * memberData.level + 100}** xp`,
					inline: true
				},
				{
					name: message.translate("economy/profile:REGISTERED"),
					value: this.client.printDate(new Date(memberData.registeredAt)),
					inline: true
				},
				{
					name: message.translate("economy/profile:BIRTHDATE"),
					value: (!userData.birthdate ? message.translate("economy/profile:NO_BIRTHDATE") : this.client.printDate(new Date(userData.birthdate))),
					inline: true
				},
				{
					name: message.translate("economy/profile:LOVER"),
					value: (!userData.lover ? message.translate("economy/profile:NO_LOVER") : this.client.users.cache.get(userData.lover).tag),
					inline: true
				},
				{
					name: message.translate("economy/profile:ACHIEVEMENTS"),
					value: message.translate("economy/profile:ACHIEVEMENTS_CONTENT", {
						prefix: data.guild.prefix
					})
				}
			])
			.setColor(data.config.embed.color) // Sets the color of the embed
			.setFooter({
				text: data.config.embed.footer
			}) // Sets the footer of the embed
			.setTimestamp();

		const buffer = await userData.getAchievements();

		message.reply({
			embeds: [profileEmbed],
			files: [{
				name: "achievements.png",
				attachment: buffer
			}]
		});
	}
}

module.exports = Profile;