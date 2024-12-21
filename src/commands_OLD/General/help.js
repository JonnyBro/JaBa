const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Help extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("help")
				.setDescription(client.translate("general/help:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/help:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/help:DESCRIPTION", null, "ru-RU"),
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
						.setAutocomplete(true),
				)
				.addBooleanOption(option =>
					option
						.setName("ephemeral")
						.setDescription(client.translate("misc:EPHEMERAL_RESPONSE"))
						.setDescriptionLocalizations({
							uk: client.translate("misc:EPHEMERAL_RESPONSE", null, "uk-UA"),
							ru: client.translate("misc:EPHEMERAL_RESPONSE", null, "ru-RU"),
						}),
				),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad(client) {
		client.on("interactionCreate", async interaction => {
			if (!interaction.isStringSelectMenu()) return;

			if (interaction.customId === "help_category_select") {
				await interaction.deferUpdate();

				interaction.data = [];
				interaction.data.guild = await client.getGuildData(interaction.guildId);

				const arg = interaction?.values[0];
				const categoryCommands = [...new Map(client.commands.map(v => [v.constructor.name, v])).values()]
					.filter(cmd => cmd.category === arg)
					.map(c => {
						return {
							name: `**${c.command.name}**`,
							value: interaction.translate(`${arg.toLowerCase()}/${c.command.name}:DESCRIPTION`),
						};
					});

				const embed = client.embed({
					author: {
						name: interaction.translate("general/help:COMMANDS_IN", { category: arg }),
					},
					fields: categoryCommands.concat({
						name: "\u200B",
						value: interaction.translate("general/help:INFO"),
					}),
				});

				return interaction.editReply({
					content: null,
					embeds: [embed],
				});
			}
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral") || false });

		const commands = [...new Map(client.commands.map(v => [v.constructor.name, v])).values()];
		const categories = [... new Set(commands.map(c => c.category))];
		const command = interaction.options.getString("command");

		if (command) {
			if (commands.find(c => c.command.name === command).category === "Owner" && interaction.user.id !== client.config.owner.id) return interaction.error("misc:OWNER_ONLY", null, { edit: true });
			else if (commands.find(c => c.command.name === command).category === "IAT" && interaction.guildId !== "1039187019957555252") return interaction.error("misc:OWNER_ONLY", null, { edit: true });
			else return interaction.editReply({ embeds: [generateCommandHelp(interaction, command)] });
		}

		const categoriesRows = categories.sort().map(c => {
			return {
				label: `${c} (${commands.filter(cmd => cmd.category === c).length})`,
				value: c,
			};
		});

		const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("help_category_select").setPlaceholder(interaction.translate("common:NOTHING_SELECTED")).addOptions(categoriesRows));

		await interaction.editReply({
			fetchReply: true,
			components: [row],
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").AutocompleteInteraction} interaction
	 * @returns
	 */
	async autocompleteRun(client, interaction) {
		const command = interaction.options.getString("command"),
			commands = [...new Map(client.commands.map(v => [v.constructor.name, v])).values()],
			results = commands.filter(c => c.command.name.includes(command));

		return await interaction.respond(
			results.slice(0, 25).map(command => ({
				name: command.command.name,
				value: command.command.name,
			})),
		);
	}
}

function getPermName(bitfield = 0) {
	for (const key in PermissionsBitField.Flags) if (PermissionsBitField.Flags[key] === BigInt(bitfield)) return key;
	return null;
}

function generateCommandHelp(interaction, command) {
	const cmd = interaction.client.commands.get(command);
	if (!cmd) return interaction.error("general/help:NOT_FOUND", { command }, { edit: true });

	if (cmd.category === "Owner" && interaction.user.id !== interaction.client.config.owner.id) return interaction.error("misc:OWNER_ONLY", null, { edit: true });
	else if (cmd.category === "IAT" && interaction.guildId !== "1039187019957555252") return interaction.error("misc:OWNER_ONLY", null, { edit: true });

	const embed = interaction.client.embed({
		author: {
			name: interaction.translate("general/help:CMD_TITLE", {
				cmd: cmd.command.name,
			}),
		},
		fields: [
			{
				name: interaction.translate("general/help:FIELD_DESCRIPTION"),
				value: interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:DESCRIPTION`),
			},
			{
				name: interaction.translate("general/help:FIELD_USAGE"),
				value: `*${cmd.command.dm_permission === false ? interaction.translate("general/help:GUILD_ONLY") : interaction.translate("general/help:NOT_GUILD_ONLY")}*\n\n${
					interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:USAGE`) === "" ? interaction.translate("misc:NO_ARGS") : interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:USAGE`)
				}`,
			},
			{
				name: interaction.translate("general/help:FIELD_EXAMPLES"),
				value: interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:EXAMPLES`),
			},
			{
				name: interaction.translate("general/help:FIELD_PERMISSIONS"),
				value: cmd.command.default_member_permissions > 0 ? interaction.translate(`misc:PERMISSIONS:${getPermName(cmd.command.default_member_permissions)}`) : interaction.translate("general/help:NO_REQUIRED_PERMISSION"),
			},
		],
	});

	return embed;
}

module.exports = Help;
