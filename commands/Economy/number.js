const { SlashCommandBuilder, MessageCollector } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	currentGames = {};

class Number extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("number")
				.setDescription(client.translate("economy/number:DESCRIPTION"))
				.setDescriptionLocalizations({ "uk": client.translate("economy/number:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(false),
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
		if (currentGames[interaction.guildId]) return interaction.error("economy/number:GAME_RUNNING");

		const participants = [],
			number = client.functions.randomNum(1000, 5000);

		await interaction.replyT("economy/number:GAME_START");

		const gameCreatedAt = Date.now();

		const filter = m => !m.author.bot;
		const collector = new MessageCollector(interaction.channel, {
			filter,
			time: (5 * 60 * 1000),
		});
		currentGames[interaction.guildId] = true;

		collector.on("collect", async msg => {
			if (!participants.includes(msg.author.id)) participants.push(msg.author.id);
			if (msg.content === "STOP") return collector.stop("force");
			if (isNaN(msg.content)) return;

			const parsedNumber = parseInt(msg.content, 10);

			if (parsedNumber === number) {
				const time = client.functions.convertTime(gameCreatedAt, false, false, data.guildData.language);
				interaction.channel.send({
					content: interaction.translate("economy/number:GAME_STATS", {
						winner: msg.author.toString(),
						number,
						time,
						participantCount: participants.length,
						participants: participants.map(p => `<@${p}>`).join(", "),
					}),
				});

				if (participants.length > 1) {
					const won = 100 * (participants.length * 0.5);

					interaction.channel.send({
						content: interaction.translate("economy/number:WON", {
							winner: msg.author.username,
							credits: `**${won}** ${client.functions.getNoun(won, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
						}),
					});

					const memberData = await client.findOrCreateMember({
						id: msg.author.id,
						guildId: interaction.guildId,
					});

					memberData.money += won;

					const info = {
						user: interaction.translate("economy/transactions:NUMBERS"),
						amount: won,
						date: Date.now(),
						type: "got",
					};
					data.memberData.transactions.push(info);

					await memberData.save();
				}
				collector.stop();
			}

			if (parseInt(msg.content) < number) msg.reply({
				content: interaction.translate("economy/number:TOO_BIG", { user: msg.author.toString(), number: parsedNumber }),
			});
			if (parseInt(msg.content) > number) msg.reply({
				content: interaction.translate("economy/number:TOO_SMALL", { user: msg.author.toString(), number: parsedNumber }),
			});
		});

		collector.on("end", (_, reason) => {
			delete currentGames[interaction.guildId];
			if (reason === "time") return interaction.editReply({ content: interaction.translate("economy/number:DEFEAT", { number }) });
			else if (reason === "force") return interaction.editReply({ content: interaction.translate("misc:FORCE_STOP", { user: interaction.member.toString() }) });
		});
	}
}

module.exports = Number;