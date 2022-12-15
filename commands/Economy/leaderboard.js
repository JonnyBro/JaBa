const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

const asyncForEach = async (collection, callback) => {
	const allPromises = collection.map(async key => {
		await callback(key);
	});

	return await Promise.all(allPromises);
};

class Leaderboard extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("leaderboard")
				.setDescription(client.translate("economy/leaderboard:DESCRIPTION"))
				.setDMPermission(false)
				.addStringOption(option => option.setName("type")
					.setDescription(client.translate("owner/debug:TYPE"))
					.setRequired(true)
					.addChoices(
						{ name: client.translate("economy/leaderboard:LEVEL"), value: "level" },
						{ name: client.translate("economy/leaderboard:MONEY"), value: "money" },
						{ name: client.translate("economy/leaderboard:REP"), value: "rep" },
					)),
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
	async execute(client, interaction) {
		await interaction.deferReply();

		const type = interaction.options.getString("type");
		const isOnMobile = JSON.stringify(Object.keys(interaction.member.presence.clientStatus)) === JSON.stringify(["mobile"]);
		if (isOnMobile) interaction.followUp({
			content: interaction.translate("economy/leaderboard:MOBILE"),
			ephemeral: true,
		});

		if (type === "money") {
			const membersLeaderboard = [],
				membersData = await client.membersData.find({ guildID: interaction.guildId }).lean();

			await asyncForEach(membersData, async member => {
				membersLeaderboard.push({
					id: member.id,
					money: member.money + member.bankSold,
				});
			});
			membersLeaderboard.sort((a, b) => b.money - a.money);
			if (membersLeaderboard.length > 20) membersLeaderboard.length = 20;

			let userNames = "";
			let money = "";
			for (let i = 0; i < membersLeaderboard.length; i++) {
				const data = membersLeaderboard[i];

				userNames += `**${i + 1}**. <@${data.id}>\n`;
				money += `${data.money}\n`;
			}

			const embed = new EmbedBuilder()
				.setAuthor({
					name: interaction.translate("economy/leaderboard:TABLE", {
						name: interaction.guild.name,
					}),
					iconURL: interaction.guild.iconURL(),
				})
				.setColor(client.config.embed.color)
				.addFields({
					name: interaction.translate("common:USER"),
					value: userNames,
					inline: true,
				}, {
					name: interaction.translate("common:CREDITS"),
					value: money,
					inline: true,
				});

			interaction.editReply({
				embeds: [embed],
			});
		} else if (type === "level") {
			const membersLeaderboard = [],
				membersData = await client.membersData.find({ guildID: interaction.guildId }).lean();

			await asyncForEach(membersData, async member => {
				membersLeaderboard.push({
					id: member.id,
					level: member.level,
					xp: member.exp,
				});
			});
			membersLeaderboard.sort((a, b) => b.level - a.level);
			if (membersLeaderboard.length > 20) membersLeaderboard.length = 20;

			const userNames = [];
			const level = [];
			const xp = [];
			for (let i = 0; i < membersLeaderboard.length; i++) {
				const data = membersLeaderboard[i];

				userNames.push(`**${i + 1}**. <@${data.id}>`);
				level.push(`${data.level}`);
				xp.push(`${data.xp} / ${5 * (data.level * data.level) + 80 * data.level + 100}`);
			}

			const embed = new EmbedBuilder()
				.setAuthor({
					name: interaction.translate("economy/leaderboard:TABLE", {
						name: interaction.guild.name,
					}),
					iconURL: interaction.guild.iconURL(),
				})
				.setColor(client.config.embed.color)
				.addFields([
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
				]);

			interaction.editReply({
				embeds: [embed],
			});
		} else if (type === "rep") {
			const usersLeaderboard = [],
				usersData = await client.usersData.find({ rep: { $gt: 0 } }).lean();

			await asyncForEach(usersData, async user => {
				usersLeaderboard.push({
					id: user.id,
					rep: user.rep,
				});
			});
			usersLeaderboard.sort((a, b) => b.rep - a.rep);
			if (usersLeaderboard.length > 20) usersLeaderboard.length = 20;

			let userNames = "";
			let rep = "";
			for (let i = 0; i < usersLeaderboard.length; i++) {
				const data = usersLeaderboard[i];

				userNames += `**${i + 1}**. <@${data.id}>\n`;
				rep += `${data.rep}\n`;
			}

			const embed = new EmbedBuilder()
				.setAuthor({
					name: interaction.translate("economy/leaderboard:TABLE", {
						name: interaction.guild.name,
					}),
					iconURL: interaction.guild.iconURL(),
				})
				.setColor(client.config.embed.color)
				.addFields({
					name: interaction.translate("common:USER"),
					value: userNames,
					inline: true,
				}, {
					name: interaction.translate("common:REP"),
					value: rep,
					inline: true,
				});

			interaction.editReply({
				embeds: [embed],
			});
		}
	}
}

module.exports = Leaderboard;