const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

const asyncForEach = async (collection, callback) => {
	const allPromises = collection.map(async key => {
		await callback(key);
	});

	return await Promise.all(allPromises);
};

class Profile extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("profile")
				.setDescription(client.translate("economy/profile:DESCRIPTION"))
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: false
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		await interaction.deferReply();

		const member = interaction.options.getMember("user") || interaction.member;
		if (member.user.bot) return interaction.error("economy/profile:BOT_USER");

		const memberData = (member.id === interaction.user.id ? data.memberData : await client.findOrCreateMember({
			id: member.id,
			guildId: interaction.guildId
		}));
		const userData = (member.id === interaction.user.id ? data.userData : await client.findOrCreateUser({
			id: member.id
		}));
		if (userData.lover && !client.users.cache.find(u => u.id === userData.lover)) await client.users.fetch(userData.lover, true);

		const guilds = client.guilds.cache.filter(g => g.members.cache.find(m => m.id === member.id));
		let globalMoney = 0;
		await asyncForEach(guilds, async guild => {
			const data = await client.findOrCreateMember({
				id: member.id,
				guildId: guild.id
			});
			globalMoney += data.money + data.bankSold;
		});

		const profileEmbed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("economy/profile:TITLE", {
					user: member.nickname
				}),
				iconURL: member.displayAvatarURL()
			})
			.setImage("attachment://achievements.png")
			.addFields([
				{
					name: client.customEmojis.link + " " + interaction.translate("economy/profile:LINK"),
					value: `[${interaction.translate("economy/profile:LINK_TEXT")}](${client.config.dashboard.baseURL}/user/${member.user.id}/${interaction.guild.id})`
				},
				{
					name: interaction.translate("economy/profile:BIO"),
					value: userData.bio ? userData.bio : interaction.translate("common:UNKNOWN")
				},
				{
					name: interaction.translate("economy/profile:CASH"),
					value: `**${memberData.money}** ${client.getNoun(memberData.money, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true
				},
				{
					name: interaction.translate("economy/profile:BANK"),
					value: `**${memberData.bankSold}** ${client.getNoun(memberData.bankSold, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true
				},
				{
					name: interaction.translate("economy/profile:GLOBAL"),
					value: `**${globalMoney}** ${client.getNoun(globalMoney, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true
				},
				{
					name: interaction.translate("economy/profile:REPUTATION"),
					value: `**${userData.rep}** ${client.getNoun(userData.rep, interaction.translate("misc:NOUNS:POINTS:1"), interaction.translate("misc:NOUNS:POINTS:2"), interaction.translate("misc:NOUNS:POINTS:5"))}`,
					inline: true
				},
				{
					name: interaction.translate("economy/profile:LEVEL"),
					value:`**${memberData.level}**`,
					inline: true
				},
				{
					name: interaction.translate("economy/profile:XP"),
					value: `**${memberData.exp}/${5 * (memberData.level * memberData.level) + 80 * memberData.level + 100}** xp`,
					inline: true
				},
				{
					name: interaction.translate("economy/profile:REGISTERED"),
					value: client.printDate(new Date(memberData.registeredAt)),
					inline: true
				},
				{
					name: interaction.translate("economy/profile:BIRTHDATE"),
					value: (!userData.birthdate ? interaction.translate("common:NOT_DEFINED") : client.printDate(new Date(userData.birthdate))),
					inline: true
				},
				{
					name: interaction.translate("economy/profile:LOVER"),
					value: (!userData.lover ? interaction.translate("common:NOT_DEFINED") : client.users.cache.get(userData.lover).tag),
					inline: true
				},
				{
					name: interaction.translate("economy/profile:ACHIEVEMENTS"),
					value: interaction.translate("economy/profile:ACHIEVEMENTS_CONTENT")
				}
			])
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			})
			.setTimestamp();

		const buffer = await userData.getAchievements();

		interaction.editReply({
			embeds: [profileEmbed],
			files: [{
				name: "achievements.png",
				attachment: buffer
			}]
		});
	}
}

module.exports = Profile;