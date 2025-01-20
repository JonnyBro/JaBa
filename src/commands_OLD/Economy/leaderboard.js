const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Leaderboard extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("leaderboard")
				.setDescription(client.translate("economy/leaderboard:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/leaderboard:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/leaderboard:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("type")
						.setDescription(client.translate("owner/debug:TYPE"))
						.setDescriptionLocalizations({
							uk: client.translate("owner/debug:TYPE", null, "uk-UA"),
							ru: client.translate("owner/debug:TYPE", null, "ru-RU"),
						})
						.setRequired(true)
						.setChoices({ name: client.translate("common:LEVEL"), value: "level" }, { name: client.translate("common:MONEY"), value: "money" }, { name: client.translate("common:REP"), value: "rep" }),
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

		const type = interaction.options.getString("type");
		const isOnMobile = JSON.stringify(Object.keys(interaction.member.presence.clientStatus)) === JSON.stringify(["mobile"]);
		if (isOnMobile)
			interaction.followUp({
				content: interaction.translate("economy/leaderboard:MOBILE"),
				ephemeral: true,
			});

		const embed = client.embed({
			author: {
				name: interaction.translate("economy/leaderboard:TABLE", {
					name: interaction.guild.name,
				}),
				iconURL: interaction.guild.iconURL(),
			},
		});

		if (type === "money") {
			const membersLeaderboard = [],
				membersData = await client.membersData.find({ guildID: interaction.guildId }).lean();

			await client.functions.asyncForEach(membersData, member => {
				membersLeaderboard.push({
					id: member.id,
					money: member.money + member.bankSold,
				});
			});
			membersLeaderboard.sort((a, b) => b.money - a.money);
			if (membersLeaderboard.length > 20) membersLeaderboard.length = 20;

			let userNames = "",
				money = "";
			for (let i = 0; i < membersLeaderboard.length; i++) {
				const data = membersLeaderboard[i];

				userNames += `**${i + 1}**. <@${data.id}>\n`;
				money += `${data.money}\n`;
			}

			embed.data.fields = [
				{
					name: interaction.translate("common:USER"),
					value: userNames,
					inline: true,
				},
				{
					name: interaction.translate("common:CREDITS"),
					value: money,
					inline: true,
				},
			];

			interaction.editReply({
				embeds: [embed],
			});
		} else if (type === "level") {
			const membersLeaderboard = [],
				membersData = await client.membersData.find({ guildID: interaction.guildId }).lean();

			await client.functions.asyncForEach(membersData, async member => {
				membersLeaderboard.push({
					id: member.id,
					level: member.level,
					xp: member.exp,
				});
			});
			membersLeaderboard.sort((a, b) => b.level - a.level);
			if (membersLeaderboard.length > 20) membersLeaderboard.length = 20;

			const userNames = [],
				level = [],
				xp = [];
			for (let i = 0; i < membersLeaderboard.length; i++) {
				const data = membersLeaderboard[i];

				userNames.push(`**${i + 1}**. <@${data.id}>`);
				level.push(`${data.level}`);
				xp.push(`${data.xp} / ${5 * (data.level * data.level) + 80 * data.level + 100}`);
			}

			embed.data.fields = [
				{
					name: interaction.translate("common:USER"),
					value: userNames.join("\n"),
					inline: true,
				},
				{
					name: interaction.translate("common:LEVEL"),
					value: level.join("\n"),
					inline: true,
				},
				{
					name: interaction.translate("common:XP"),
					value: xp.join("\n"),
					inline: true,
				},
			];

			interaction.editReply({
				embeds: [embed],
			});
		} else if (type === "rep") {
			const usersLeaderboard = [],
				usersData = await client.usersData.find({ rep: { $gt: 0 } }).lean();

			await client.functions.asyncForEach(usersData, async user => {
				usersLeaderboard.push({
					id: user.id,
					rep: user.rep,
				});
			});
			usersLeaderboard.sort((a, b) => b.rep - a.rep);
			if (usersLeaderboard.length > 20) usersLeaderboard.length = 20;

			let userNames = "",
				rep = "";
			for (let i = 0; i < usersLeaderboard.length; i++) {
				const data = usersLeaderboard[i];

				userNames += `**${i + 1}**. <@${data.id}>\n`;
				rep += `${data.rep}\n`;
			}

			embed.data.fields = [
				{
					name: interaction.translate("common:USER"),
					value: userNames,
					inline: true,
				},
				{
					name: interaction.translate("common:REP"),
					value: rep,
					inline: true,
				},
			];

			interaction.editReply({
				embeds: [embed],
			});
		}
	}
}

module.exports = Leaderboard;
