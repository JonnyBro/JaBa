const { SlashCommandBuilder, MessageCollector, ButtonBuilder, ActionRowBuilder, ButtonStyle, ThreadAutoArchiveDuration } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	currentGames = {};

class Number extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("number")
				.setDescription(client.translate("fun/number:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("fun/number:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("fun/number:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction, data) {
		if (currentGames[interaction.guildId]) return interaction.error("fun/number:GAME_RUNNING");

		const participants = [],
			number = client.functions.randomNum(100, 101);

		await interaction.replyT("fun/number:GAME_START");

		let channel;

		if (interaction.channel.isThread()) channel = interaction.channel;
		else
			channel = await interaction.channel.threads.create({
				name: `number-guessing-${client.functions.randomNum(10000, 20000)}`,
				autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
			});

		const gameCreatedAt = Date.now();
		const filter = m => !m.author.bot;
		const collector = new MessageCollector(channel, {
			filter,
			time: 5 * 60 * 1000,
		});
		currentGames[interaction.guildId] = true;

		collector.on("collect", async msg => {
			if (!participants.includes(msg.author)) participants.push(msg.author);
			if (msg.content === "STOP") return collector.stop("force");
			if (isNaN(msg.content)) return;

			const parsedNumber = parseInt(msg.content, 10);

			if (parsedNumber === number) {
				channel.send({
					content: interaction.translate("fun/number:GAME_STATS", {
						winner: msg.author.toString(),
						number,
						time: `<t:${Math.floor(gameCreatedAt / 1000)}:R>`,
						participantCount: participants.length,
						participants: participants.map(p => p.toString()).join(", "),
					}),
				});

				if (participants.length > 1) {
					const won = 100 * (participants.length * 0.5);

					channel.send({
						content: interaction.translate("fun/number:WON", {
							winner: msg.author.toString(),
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

					memberData.markModified("transactions");
					await memberData.save();
				}

				interaction.editReply({
					content: interaction.translate("fun/number:GAME_STATS", {
						winner: msg.author.toString(),
						number,
						time: `<t:${Math.floor(gameCreatedAt / 1000)}:R>`,
						participantCount: participants.length,
						participants: participants.map(p => p.toString()).join(", "),
					}),
				});

				const deleteYes = new ButtonBuilder()
					.setCustomId("number_delete_yes")
					.setLabel(interaction.translate("common:YES"))
					.setStyle(ButtonStyle.Danger);
				const deleteNo = new ButtonBuilder()
					.setCustomId("number_delete_no")
					.setLabel(interaction.translate("common:NO"))
					.setStyle(ButtonStyle.Secondary);
				const row = new ActionRowBuilder().addComponents(deleteYes, deleteNo);

				channel.send({
					content: interaction.translate("fun/number:DELETE_CHANNEL"),
					components: [row],
				});

				collector.stop();
			}

			if (parseInt(msg.content) < number)
				msg.reply({
					content: interaction.translate("fun/number:TOO_BIG", { user: msg.author.toString(), number: parsedNumber }),
				});
			if (parseInt(msg.content) > number)
				msg.reply({
					content: interaction.translate("fun/number:TOO_SMALL", { user: msg.author.toString(), number: parsedNumber }),
				});
		});

		collector.on("end", (_, reason) => {
			delete currentGames[interaction.guildId];

			if (reason === "time") return interaction.editReply({ content: interaction.translate("fun/number:DEFEAT", { number }) });
			else if (reason === "force") return interaction.editReply({ content: interaction.translate("misc:FORCE_STOP", { user: interaction.member.toString(), number }) });
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad(client) {
		client.on("interactionCreate", async interaction => {
			if (!interaction.isButton()) return;

			await interaction.deferUpdate();

			if (interaction.customId === "number_delete_yes")
				interaction.channel.delete();
			else if (interaction.customId === "number_delete_no") {
				await interaction.message.delete();
				interaction.channel.setArchived(true);
			}
		});
	}
}

module.exports = Number;
