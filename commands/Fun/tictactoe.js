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
				.setDescription(client.translate("fun/tictactoe:DESCRIPTION"))
				.setDescriptionLocalizations({ "uk": client.translate("fun/tictactoe:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(false)
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))
					.setDescriptionLocalizations({ "uk": client.translate("common:USER", null, "uk-UA") })
					.setRequired(true)),
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
		tictactoe(interaction, {
			resultBtn: true,
			embedColor: client.config.embed.color,
			embedFoot: client.config.embed.footer,
		}).then(async winner => {
			const memberData = await client.findOrCreateMember({
				id: winner.id,
				guildId: interaction.guildId,
			});

			memberData.money += 100;
			await memberData.save();

			const info = {
				user: interaction.translate("economy/transactions:TTT"),
				amount: 100,
				date: Date.now(),
				type: "got",
			};
			memberData.transactions.push(info);
		});
	}
}

module.exports = TicTacToe;