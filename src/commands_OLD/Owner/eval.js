const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Eval extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("eval")
				.setDescription(client.translate("owner/eval:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("owner/eval:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("owner/eval:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("code")
						.setDescription(client.translate("owner/eval:CODE"))
						.setDescriptionLocalizations({
							uk: client.translate("owner/eval:CODE", null, "uk-UA"),
							ru: client.translate("owner/eval:CODE", null, "ru-RU"),
						})
						.setRequired(true),
				),
			dirname: __dirname,
			ownerOnly: true,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const code = interaction.options.getString("code");
		const result = new Promise(resolve => resolve(eval(code)));

		return result
			.then(output => {
				if (typeof output !== "string") output = require("util").inspect(output);
				if (output.includes(client.token)) output = output.replace(client.token, "T0K3N");

				interaction.editReply({
					content: "```js\n" + output + "```",
				});
			})
			.catch(err => {
				console.log(err);
				err = err.toString();
				if (err.includes(client.token)) err = err.replace(client.token, "T0K3N");

				interaction.editReply({
					content: "```js\n" + err + "```",
				});
			});
	}
}
module.exports = Eval;
