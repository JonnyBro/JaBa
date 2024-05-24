const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Profile extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("profile")
				.setDescription(client.translate("economy/profile:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/profile:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/profile:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
						}),
				),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const member = interaction.options.getMember("user") || interaction.member;
		if (member.user.bot) return interaction.error("economy/profile:BOT_USER");

		const memberData = member.id === interaction.user.id ? interaction.data.member : await client.getMemberData(member.id, interaction.guildId);
		const userData = member.id === interaction.user.id ? interaction.data.user : await client.getUserData(member.id);
		if (userData.lover && !client.users.cache.find(u => u.id === userData.lover)) await client.users.fetch(userData.lover, true);

		const guilds = client.guilds.cache.filter(g => g.members.cache.find(m => m.id === member.id));
		let globalMoney = 0;
		await client.functions.asyncForEach(guilds, async guild => {
			const data = await client.getMemberData(member.id, guild.id);
			globalMoney += data.money + data.bankSold;
		});

		const lover = client.users.cache.get(userData.lover);

		const embed = client.embed({
			author: {
				name: interaction.translate("economy/profile:TITLE", {
					user: member.user.getUsername(),
				}),
				iconURL: member.displayAvatarURL(),
			},
			image: "attachment://achievements.png",
			fields: [
				{
					name: interaction.translate("economy/profile:BIO"),
					value: userData.bio ? userData.bio : interaction.translate("common:UNKNOWN"),
				},
				{
					name: interaction.translate("economy/profile:CASH"),
					value: `**${memberData.money}** ${client.functions.getNoun(memberData.money, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:BANK"),
					value: `**${memberData.bankSold}** ${client.functions.getNoun(memberData.bankSold, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:GLOBAL"),
					value: `**${globalMoney}** ${client.functions.getNoun(globalMoney, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:REPUTATION"),
					value: `**${userData.rep}** ${client.functions.getNoun(userData.rep, interaction.translate("misc:NOUNS:POINTS:1"), interaction.translate("misc:NOUNS:POINTS:2"), interaction.translate("misc:NOUNS:POINTS:5"))}`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:LEVEL"),
					value: `**${memberData.level}**`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:XP"),
					value: `**${memberData.exp}/${5 * (memberData.level * memberData.level) + 80 * memberData.level + 100}** xp`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:REGISTERED"),
					value: `<t:${Math.floor(memberData.registeredAt / 1000)}:f>`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:BIRTHDATE"),
					value: !userData.birthdate ? interaction.translate("common:NOT_DEFINED") : `<t:${userData.birthdate}:D>`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:LOVER"),
					value: !userData.lover ? interaction.translate("common:NOT_DEFINED") : lover.toString(),
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:ACHIEVEMENTS"),
					value: interaction.translate("economy/profile:ACHIEVEMENTS_CONTENT"),
				},
			],
		});

		const achievements = await userData.getAchievements();

		interaction.editReply({
			embeds: [embed],
			files: [
				{
					name: "achievements.png",
					attachment: achievements,
				},
			],
		});
	}
}

module.exports = Profile;
