const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	i18next = require("i18next"),
	autoUpdateDocs = require("../../helpers/autoUpdateDocs");

class Reload extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("reload")
				.setDescription(client.translate("owner/reload:DESCRIPTION"))
				.addStringOption(option => option.setName("command")
					.setDescription(client.translate("owner/reload:COMMAND"))
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
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const command = interaction.options.getString("command");
		const cmd = client.commands.get(command);
		if (!cmd) return interaction.error("general/help:NOT_FOUND", { search: command }, { ephemeral: true });

		await client.unloadCommand(`../commands/${cmd.category}`, cmd.command.name);
		await client.loadCommand(`../commands/${cmd.category}`, cmd.command.name);

		i18next.reloadResources(["ru-RU", "uk-UA"]);
		autoUpdateDocs.update(client);

		interaction.success("owner/reload:SUCCESS", {
			command: cmd.command.name
		}, { ephemeral: true });
	}
}

module.exports = Reload;