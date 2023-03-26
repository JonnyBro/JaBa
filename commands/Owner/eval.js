const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Eval extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("eval")
				.setDescription(client.translate("owner/eval:DESCRIPTION"))
				.setDescriptionLocalizations({ "uk": client.translate("owner/eval:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(true)
				.addStringOption(option => option.setName("code")
					.setDescription(client.translate("owner/eval:CODE"))
					.setDescriptionLocalizations({ "uk": client.translate("owner/eval:CODE", null, "uk-UA") })
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			ownerOnly: true,
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
	// eslint-disable-next-line no-unused-vars
	async execute(client, interaction, data) {
		await interaction.deferReply({ ephemeral: true });

		const code = interaction.options.getString("code");
		const result = new Promise(resolve => resolve(eval(code)));

		return result.then(output => {
			if (typeof output != "string") output = require("util").inspect(output, { depth: 0 });
			if (output.includes(client.token)) output = output.replace(client.token, "T0K3N");

			interaction.editReply({
				content: "```js\n" + output + "```",
			});
		}).catch(err => {
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