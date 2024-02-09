const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Money extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("money")
				.setDescription(client.translate("economy/money:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/money:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/money:DESCRIPTION", null, "ru-RU"),
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
		if (member.user.bot) return interaction.error("economy/money:BOT_USER");

		const memberData = member.id === interaction.user.id ? interaction.data.member : await client.findOrCreateMember({ id: member.id, guildId: interaction.guildId });

		const guilds = client.guilds.cache.filter(g => g.members.cache.find(m => m.id === member.id));

		let globalMoney = 0;
		await client.functions.asyncForEach(guilds, async guild => {
			const data = await client.findOrCreateMember({
				id: member.id,
				guildId: guild.id,
			});
			globalMoney += data.money + data.bankSold;
		});

		const embed = client.embed({
			author: {
				name: interaction.translate("economy/money:TITLE", {
					user: member.user.getUsername(),
				}),
				iconURL: member.user.displayAvatarURL(),
			},
			fields: [
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
			],
		});

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Money;
