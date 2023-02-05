const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Money extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("money")
				.setDescription(client.translate("economy/money:DESCRIPTION"))
				.setDMPermission(false)
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
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
		if (member.user.bot) return interaction.error("economy/money:BOT_USER");

		const memberData = member.id === interaction.user.id ? data.memberData : await client.findOrCreateMember({
			id: member.id,
			guildId: interaction.guildId,
		});

		const guilds = client.guilds.cache.filter(g => g.members.cache.find(m => m.id === member.id));
		let globalMoney = 0;
		await client.functions.asyncForEach(guilds, async guild => {
			const data = await client.findOrCreateMember({
				id: member.id,
				guildId: guild.id,
			});
			globalMoney += data.money + data.bankSold;
		});

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("economy/money:TITLE", {
					username: member.user.tag,
				}),
				iconURL: member.user.displayAvatarURL(),
			})
			.addFields([
				{
					name: interaction.translate("economy/profile:CASH"),
					value: `**${memberData.money}** ${client.getNoun(memberData.money, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:BANK"),
					value: `**${memberData.bankSold}** ${client.getNoun(memberData.bankSold, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true,
				},
				{
					name: interaction.translate("economy/profile:GLOBAL"),
					value: `**${globalMoney}** ${client.getNoun(globalMoney, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					inline: true,
				},
			])
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer,
			});
		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Money;