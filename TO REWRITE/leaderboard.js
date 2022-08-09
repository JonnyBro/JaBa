const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

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
				.addStringOption(option => option.setName("type")
					.setDescription(client.translate("owner/debug:TYPE"))
					.setRequired(true)
					.addChoices(
						{ name: client.translate("economy/leaderboard:LEVEL"), value: "level" },
						{ name: client.translate("economy/leaderboard:MONEY"), value: "money" },
						{ name: client.translate("economy/leaderboard:REP"), value: "rep" }
					)),
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
	async execute(client, interaction) {
		await interaction.deferReply();
		const type = interaction.options.getString("type");
		const isOnMobile = JSON.stringify(Object.keys(interaction.member.presence.clientStatus)) === JSON.stringify(["mobile"]);
		if (isOnMobile) interaction.followUp({
			content: interaction.translate("economy/leaderboard:MOBILE"),
			ephemeral: true
		});

		if (type === "money") {
			const members = await client.membersData.find({
					guildID: interaction.guildId
				}).lean(),
				membersLeaderboard = members.map(m => {
					return {
						id: m.id,
						money: m.money + m.bankSold
					};
				}).sort((a, b) => b.money - a.money);
			if (membersLeaderboard.length > 20) membersLeaderboard.length = 20;

			let userNames = "";
			let money = "";
			for (let i = 0; i < membersLeaderboard.length; i++) {
				const data = membersLeaderboard[i];
				const user = await client.users.fetch(data.id);

				userNames += `**${i + 1}**. ${user}\n`;
				money += `${data.money}\n`;
			}

			const embed = new EmbedBuilder()
				.setAuthor({
					name: interaction.translate("economy/leaderboard:TABLE", {
						name: interaction.guild.name
					}),
					iconURL: interaction.guild.iconURL()
				})
				.setColor(client.config.embed.color)
				.addFields({
					name: interaction.translate("economy/leaderboard:TOP"),
					value: userNames,
					inline: true
				}, {
					name: interaction.translate("common:CREDITS"),
					value: money,
					inline: true
				});

			interaction.editReply({
				embeds: [embed]
			});
		} else if (type === "level") {
			const membersLeaderboard = [];
			client.membersData.find({
				guildID: interaction.guildId
			}).lean().then(async m => {
				await membersLeaderboard.push({
					id: m.id,
					level: m.level,
					xp: m.exp
				});
			});
			membersLeaderboard.sort((a, b) => b.level - a.level);
			if (membersLeaderboard.length > 20) membersLeaderboard.length = 20;

			const userNames = [];
			const level = [];
			const xp = [];
			for (let i = 0; i < membersLeaderboard.length; i++) {
				const data = membersLeaderboard[i];
				const user = await client.users.fetch(data.id);

				userNames.push(`**${i + 1}**. ${user.tag}`);
				level.push(`${data.level}`);
				xp.push(`${data.xp} / ${5 * (data.level * data.level) + 80 * data.level + 100}`);
			}

			const embed = new EmbedBuilder()
				.setAuthor({
					name: interaction.translate("economy/leaderboard:TABLE", {
						name: interaction.guild.name
					}),
					iconURL: interaction.guild.iconURL()
				})
				.setColor(client.config.embed.color)
				.addFields([
					{
						name: interaction.translate("economy/leaderboard:TOP"),
						value: userNames.join("\n"),
						inline: true
					},
					{
						name: interaction.translate("common:LEVEL"),
						value: level.join("\n"),
						inline: true
					},
					{
						name: interaction.translate("common:XP"),
						value: xp.join("\n"),
						inline: true
					}
				]);

			interaction.editReply({
				embeds: [embed]
			});
		} else if (type === "rep") {
			const users = await client.usersData.find({
					rep: { $gt: 0 }
				}).lean(),
				usersLeaderboard = users.map(u => {
					return {
						id: u.id,
						rep: u.rep
					};
				}).sort((a, b) => b.rep - a.rep);
			if (usersLeaderboard.length > 20) usersLeaderboard.length = 20;

			let userNames = "";
			let rep = "";
			for (let i = 0; i < usersLeaderboard.length; i++) {
				const data = usersLeaderboard[i];
				const user = await client.users.fetch(data.id);

				userNames += `**${i + 1}**. ${user}\n`;
				rep += `${data.rep}\n`;
			}

			const embed = new EmbedBuilder()
				.setAuthor({
					name: interaction.translate("economy/leaderboard:TABLE", {
						name: interaction.guild.name
					}),
					iconURL: interaction.guild.iconURL()
				})
				.setColor(client.config.embed.color)
				.addFields({
					name: interaction.translate("economy/leaderboard:TOP"),
					value: userNames,
					inline: true
				}, {
					name: interaction.translate("common:REP"),
					value: rep,
					inline: true
				});

			interaction.editReply({
				embeds: [embed]
			});
		}
	}
}

module.exports = Leaderboard;