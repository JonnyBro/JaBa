const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Slots extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("slots")
				.setDescription(client.translate("economy/slots:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("economy/slots:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("economy/slots:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addIntegerOption(option =>
					option
						.setName("amount")
						.setDescription(client.translate("common:INT"))
						.setDescriptionLocalizations({
							uk: client.translate("common:INT", null, "uk-UA"),
							ru: client.translate("common:INT", null, "ru-RU"),
						})
						.setRequired(true),
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

		const { member: memberData, user: userData } = interaction.data,
			amount = interaction.options.getInteger("amount");
		if (amount > memberData.money)
			return interaction.error("economy/slots:NOT_ENOUGH", {
				money: `**${amount}** ${client.functions.getNoun(amount, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
			}, { edit: true });

		const fruits = ["🍎", "🍐", "🍌", "🍇", "🍉", "🍒", "🍓"];

		let i1 = 0,
			j1 = 0,
			k1 = 0,
			i2 = 1,
			j2 = 1,
			k2 = 1,
			i3 = 2,
			j3 = 2,
			k3 = 2;

		const colonnes = [client.functions.shuffle(fruits), client.functions.shuffle(fruits), client.functions.shuffle(fruits)];

		function getCredits(number, isJackpot) {
			if (!isJackpot) number = number * 1.5;
			else if (isJackpot) number = number * 5;

			return Math.round(number);
		}

		editMsg();

		const interval = setInterval(editMsg, 1000);

		setTimeout(() => {
			clearInterval(interval);
			end();
		}, 4000);

		async function end() {
			let msg = "[ :slot_machine: | **SLOTS** ]\n------------------\n";

			i1 = i1 < fruits.length - 1 ? i1 + 1 : 0;
			i2 = i2 < fruits.length - 1 ? i2 + 1 : 0;
			i3 = i3 < fruits.length - 1 ? i3 + 1 : 0;
			j1 = j1 < fruits.length - 1 ? j1 + 1 : 0;
			j2 = j2 < fruits.length - 1 ? j2 + 1 : 0;
			j3 = j3 < fruits.length - 1 ? j3 + 1 : 0;
			k1 = k1 < fruits.length - 1 ? k1 + 1 : 0;
			k2 = k2 < fruits.length - 1 ? k2 + 1 : 0;
			k3 = k3 < fruits.length - 1 ? k3 + 1 : 0;

			msg += colonnes[0][i1] + " : " + colonnes[1][j1] + " : " + colonnes[2][k1] + "\n";
			msg += colonnes[0][i2] + " : " + colonnes[1][j2] + " : " + colonnes[2][k2] + " **<**\n";
			msg += colonnes[0][i3] + " : " + colonnes[1][j3] + " : " + colonnes[2][k3] + "\n------------------\n";

			if (colonnes[0][i2] == colonnes[1][j2] && colonnes[1][j2] == colonnes[2][k2]) {
				msg += "| : : :  **" + interaction.translate("common:VICTORY").toUpperCase() + "**  : : : |";
				await interaction.editReply({
					content: msg,
				});

				const credits = getCredits(amount, true);
				interaction.followUp({
					content:
						"**!! JACKPOT !!**\n" +
						interaction.translate("economy/slots:VICTORY", {
							money: `**${amount}** ${client.functions.getNoun(amount, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
							won: `**${credits}** ${client.functions.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
							user: interaction.member.toString(),
						}),
				});

				const toAdd = credits - amount;

				const info = {
					user: interaction.translate("economy/slots:DESCRIPTION"),
					amount: toAdd,
					date: Date.now(),
					type: "got",
				};

				memberData.money += toAdd;
				memberData.transactions.push(info);

				if (!userData.achievements.slots.achieved) {
					userData.achievements.slots.progress.now += 1;
					if (userData.achievements.slots.progress.now === userData.achievements.slots.progress.total) {
						userData.achievements.slots.achieved = true;
						interaction.followUp({
							files: [
								{
									name: "achievement_unlocked4.png",
									attachment: "./assets/img/achievements/achievement_unlocked4.png",
								},
							],
						});
					}

					userData.markModified("achievements");
					await userData.save();
				}

				memberData.markModified("money");
				memberData.markModified("transactions");
				await memberData.save();

				return;
			}

			if (colonnes[0][i2] == colonnes[1][j2] || colonnes[1][j2] == colonnes[2][k2] || colonnes[0][i2] == colonnes[2][k2]) {
				msg += "| : : :  **" + interaction.translate("common:VICTORY").toUpperCase() + "**  : : : |";
				await interaction.editReply({
					content: msg,
				});

				const credits = getCredits(amount, false);
				interaction.followUp({
					content: interaction.translate("economy/slots:VICTORY", {
						money: `**${amount}** ${client.functions.getNoun(amount, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
						won: `**${credits}** ${client.functions.getNoun(credits, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
						user: interaction.member.toString(),
					}),
				});
				const toAdd = credits - amount;

				const info = {
					user: interaction.translate("economy/slots:DESCRIPTION"),
					amount: toAdd,
					date: Date.now(),
					type: "got",
				};

				memberData.money += toAdd;
				memberData.transactions.push(info);

				if (!userData.achievements.slots.achieved) {
					userData.achievements.slots.progress.now += 1;
					if (userData.achievements.slots.progress.now === userData.achievements.slots.progress.total) {
						userData.achievements.slots.achieved = true;
						interaction.followUp({
							files: [
								{
									name: "achievement_unlocked4.png",
									attachment: "./assets/img/achievements/achievement_unlocked4.png",
								},
							],
						});
					}

					userData.markModified("achievements");
					await userData.save();
				}

				memberData.markModified("money");
				memberData.markModified("transactions");
				await memberData.save();

				return;
			}

			msg += "| : : :  **" + interaction.translate("common:DEFEAT").toUpperCase() + "**  : : : |";
			interaction.followUp({
				content: interaction.translate("economy/slots:DEFEAT", {
					money: `**${amount}** ${client.functions.getNoun(amount, interaction.translate("misc:NOUNS:CREDIT:1"), interaction.translate("misc:NOUNS:CREDIT:2"), interaction.translate("misc:NOUNS:CREDIT:5"))}`,
					user: interaction.member.toString(),
				}),
			});

			const info = {
				user: interaction.translate("economy/slots:DESCRIPTION"),
				amount: amount,
				date: Date.now(),
				type: "send",
			};

			memberData.money -= amount;
			memberData.transactions.push(info);

			if (!userData.achievements.slots.achieved) {
				userData.achievements.slots.progress.now = 0;

				userData.markModified("achievements");
				await userData.save();
			}

			memberData.markModified("money");
			memberData.markModified("transactions");
			await memberData.save();

			return;
		}

		async function editMsg() {
			let msg = "[ :slot_machine: | **SLOTS** ]\n------------------\n";

			i1 = i1 < fruits.length - 1 ? i1 + 1 : 0;
			i2 = i2 < fruits.length - 1 ? i2 + 1 : 0;
			i3 = i3 < fruits.length - 1 ? i3 + 1 : 0;
			j1 = j1 < fruits.length - 1 ? j1 + 1 : 0;
			j2 = j2 < fruits.length - 1 ? j2 + 1 : 0;
			j3 = j3 < fruits.length - 1 ? j3 + 1 : 0;
			k1 = k1 < fruits.length - 1 ? k1 + 1 : 0;
			k2 = k2 < fruits.length - 1 ? k2 + 1 : 0;
			k3 = k3 < fruits.length - 1 ? k3 + 1 : 0;

			msg += colonnes[0][i1] + " : " + colonnes[1][j1] + " : " + colonnes[2][k1] + "\n";
			msg += colonnes[0][i2] + " : " + colonnes[1][j2] + " : " + colonnes[2][k2] + " **<**\n";
			msg += colonnes[0][i3] + " : " + colonnes[1][j3] + " : " + colonnes[2][k3] + "\n";

			await interaction.editReply({
				content: msg,
			});
		}
	}
}

module.exports = Slots;
