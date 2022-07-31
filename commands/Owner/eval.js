/* eslint-disable no-unused-vars */
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
				.addStringOption(option =>
					option.setName("code")
						.setDescription(client.translate("owner/eval:CODE"))
						.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: true
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad(client) {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").CommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction, data) {
		const code = interaction.options.getString("code");
		const result = new Promise((resolve) => resolve(eval(code)));

		return result.then((output) => {
			if (typeof output != "string") output = require("util").inspect(output, { depth: 0 });

			if (output.includes(client.token)) output = output.replace(client.token, "T0K3N");
			interaction.reply({
				content: "```js\n" + output + "```",
				ephemeral: true
			});
		}).catch((err) => {
			console.error(err);
			err = err.toString();

			if (err.includes(client.token)) err = err.replace(client.token, "T0K3N");
			interaction.reply({
				content: "```js\n" + err + "```",
				ephemeral: true
			});
		});
	}
}
module.exports = Eval;