const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	i18next = require("i18next");
// autoUpdateDocs = require("../../helpers/autoUpdateDocs");

class Reload extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("reload")
				.setDescription(client.translate("owner/reload:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("owner/reload:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("owner/reload:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("command")
						.setDescription(client.translate("common:COMMAND"))
						.setDescriptionLocalizations({
							uk: client.translate("common:COMMAND", null, "uk-UA"),
							ru: client.translate("common:COMMAND", null, "ru-RU"),
						})
						.setRequired(true)
						.setAutocomplete(true),
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

		const command = interaction.options.getString("command"),
			cmd = client.commands.get(command);
		if (!cmd) return interaction.error("owner/reload:NOT_FOUND", { command }, { ephemeral: true });

		client.unloadCommand(`../commands/${cmd.category}`, cmd.command.name);

		await client.loadCommand(`../commands/${cmd.category}`, cmd.command.name);

		i18next.reloadResources(["ru-RU", "uk-UA", "en-US"]);
		// autoUpdateDocs.update(client);

		interaction.success("owner/reload:SUCCESS", {
			command: cmd.command.name,
		}, { edit: true });
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").AutocompleteInteraction} interaction
	 * @returns
	 */
	async autocompleteRun(client, interaction) {
		const command = interaction.options.getString("command"),
			results = client.commands.filter(c => c.command.name.includes(command));

		return await interaction.respond(
			results
				.map(c => c)
				.slice(0, 25)
				.map(c => ({
					name: c.command.name,
					value: c.command.name,
				})),
		);
	}
}

module.exports = Reload;
