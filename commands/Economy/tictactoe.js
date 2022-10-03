const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	tictactoe = require("../../helpers/tictactoe");

class TicTacToe extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("tictactoe")
				.setDescription(client.translate("economy/tictactoe:DESCRIPTION"))
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))
					.setRequired(true)),
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
		tictactoe(interaction, {
			resultBtn: true,
			embedColor: client.config.embed.color,
			embedFoot: client.config.embed.footer
		}).then(async winner => {
			const memberData = await client.findOrCreateMember({
				id: winner.id,
				guildId: interaction.guildId
			});

			const info = {
				user: interaction.translate("economy/transactions:TTT"),
				amount: 100,
				date: Date.now(),
				type: "got"
			};
			memberData.transactions.push(info);

			memberData.money += 100;
			await memberData.save();
		});
	}
}

module.exports = TicTacToe;