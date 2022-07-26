const { SlashCommandBuilder } = require("@discordjs/builders"),
	BaseCommand = require("../../base/BaseCommand"),
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
				.addStringOption(option =>
					option.setName("command")
						.setDescription(client.translate("owner/reload:USAGE"))
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
	 * @param {import("discord.js").CommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		interaction.deferReply({ ephemeral: true });

		const command = interaction.options.getString("command");
		const cmd = client.commands.get(command);
		if (!cmd) return interaction.error("owner/reload:NOT_FOUND", { search: command });

		await client.unloadCommand(`../commands/${cmd.category}`, cmd.command.name);
		await client.loadCommand(`../commands/${cmd.category}`, cmd.command.name);

		i18next.reloadResources(["ru-RU", "uk-UA"]);
		autoUpdateDocs.update(client);

		interaction.success("owner/reload:SUCCESS", {
			command: cmd.command.name
		}, { edit: true, ephemeral: true });
	}
}

module.exports = Reload;