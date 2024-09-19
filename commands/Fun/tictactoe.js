const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	tictactoe = require("../../helpers/tictactoe");

class TicTacToe extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("tictactoe")
				.setDescription(client.translate("fun/tictactoe:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("fun/tictactoe:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("fun/tictactoe:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
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
		const winner = await tictactoe(interaction, {
			resultBtn: true,
			embedColor: client.config.embed.color,
			embedFoot: client.config.embed.footer,
		});

		const memberData = await client.getMemberData(winner.id, interaction.guildId);
		memberData.money += 100;

		const info = {
			user: interaction.translate("economy/transactions:TTT"),
			amount: 100,
			date: Date.now(),
			type: "got",
		};

		memberData.transactions.push(info);

		await memberData.save();
	}
}

module.exports = TicTacToe;
