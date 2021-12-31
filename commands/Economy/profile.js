const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

const asyncForEach = async (array, callback) => {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	};
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
			cooldown: 2000
		});
	}

	async run(message, args, data) {
		const client = this.client;

		const arg = args[0] || message.author
		let member = await client.resolveMember(arg, message.guild);
		if (!member) member = message.member;
		if (member.user.bot) return message.error("economy/profile:BOT_USER");

		const memberData = (member.id === message.author.id ? data.memberData : await client.findOrCreateMember({
			id: member.id,
			guildID: message.guild.id
		}));
		const userData = (member.id === message.author.id ? data.userData : await client.findOrCreateUser({
			id: member.id
		}));
		if (userData.lover && !this.client.users.cache.get(userData.lover)) await this.client.users.fetch(userData.lover, true);

		const commonsGuilds = client.guilds.cache.filter((g) => g.members.cache.get(member.id));
		let globalMoney = 0;
		await asyncForEach(commonsGuilds.array(), async (guild) => {
			const memberData = await client.findOrCreateMember({
				id: member.id,
				guildID: guild.id
			});
			globalMoney += memberData.money;
			globalMoney += memberData.bankSold;
		});

		const profileEmbed = new Discord.MessageEmbed()
			.setAuthor(message.translate("economy/profile:TITLE", {
				username: member.user.tag
			}), member.user.displayAvatarURL({
				size: 512,
				dynamic: true,
				format: "png"
			}))
			.attachFiles([{
				attachment: await userData.getAchievements(),
				name: "achievements.png"
			}])
			.setImage("attachment://achievements.png")
			.addField(message.translate("economy/profile:BIO"), userData.bio ? userData.bio : message.translate("economy/profile:NO_BIO"))
			.addField(message.translate("economy/profile:CASH"), `**${memberData.money}** ${this.client.getNoun(memberData.money, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`, true)
			.addField(message.translate("economy/profile:BANK"), `**${memberData.bankSold}** ${this.client.getNoun(memberData.bankSold, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`, true)
			.addField(message.translate("economy/profile:GLOBAL"), `**${globalMoney}** ${this.client.getNoun(globalMoney, message.translate("misc:NOUNS:CREDIT:1"), message.translate("misc:NOUNS:CREDIT:2"), message.translate("misc:NOUNS:CREDIT:5"))}`, true)
			.addField(message.translate("economy/profile:REPUTATION"), `**${userData.rep}** ${this.client.getNoun(userData.rep, message.translate("misc:NOUNS:POINTS:1"), message.translate("misc:NOUNS:POINTS:2"), message.translate("misc:NOUNS:POINTS:5"))}`, true)
			.addField(message.translate("economy/profile:LEVEL"), `**${memberData.level}**`, true)
			.addField(message.translate("economy/profile:EXP"), `**${memberData.exp}/${5 * (memberData.level * memberData.level) + 80 * memberData.level + 100}** xp`, true)
			.addField(message.translate("economy/profile:REGISTERED"), message.printDate(new Date(memberData.registeredAt)), true)
			.addField(message.translate("economy/profile:BIRTHDATE"), (!userData.birthdate ? message.translate("economy/profile:NO_BIRTHDATE") : message.printDate(new Date(userData.birthdate))), true)
			.addField(message.translate("economy/profile:LOVER"), (!userData.lover ? message.translate("economy/profile:NO_LOVER") : this.client.users.cache.get(userData.lover).tag), true)
			.addField(message.translate("economy/profile:ACHIEVEMENTS"), message.translate("economy/profile:ACHIEVEMENTS_CONTENT", {
				prefix: data.guild.prefix
			}))
			.setColor(data.config.embed.color) // Sets the color of the embed
			.setFooter(data.config.embed.footer) // Sets the footer of the embed
			.setTimestamp();

		message.channel.send(profileEmbed); // Send the embed in the current channel
	}
};

module.exports = Profile;