const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Help extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
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
				.setDMPermission(true)
				.addStringOption(option =>
					option
						.setName("command")
						.setDescription(client.translate("common:COMMAND"))
						.setDescriptionLocalizations({
							uk: client.translate("common:COMMAND", null, "uk-UA"),
							ru: client.translate("common:COMMAND", null, "ru-RU"),
						})
						.setAutocomplete(true),
				),
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
		await interaction.deferReply();

		const commands = [...new Map(client.commands.map(v => [v.constructor.name, v])).values()];
		const categories = [];
		const command = interaction.options.getString("command");

		if (command) {
			if (commands.find(c => c.command.name === command).category === "Owner" && interaction.user.id !== client.config.owner.id) return interaction.error("misc:OWNER_ONLY", null, { edit: true, ephemeral: true });

			return interaction.editReply({ embeds: [generateCommandHelp(interaction, command)] });
		}

		commands.forEach(c => {
			if (!categories.includes(c.category)) {
				if (c.category === "Owner" && interaction.user.id !== client.config.owner.id) return;
				if (c.category === "IAT" && interaction.guildId !== "1039187019957555252") return;
				if (c.category === "SunCountry" && interaction.guildId !== "600970971410857996") return;

				categories.push(c.category);
			}
		});

		const categoriesRows = categories.sort().map(c => {
			return {
				label: `${c} (${commands.filter(cmd => cmd.category === c).length})`,
				value: c,
			};
		});

		const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("help_category_select").setPlaceholder(client.translate("common:NOTHING_SELECTED")).addOptions(categoriesRows));

		const msg = await interaction.editReply({
			content: interaction.translate("common:AVAILABLE_OPTIONS"),
			fetchReply: true,
			components: [row],
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = msg.createMessageComponentCollector({ filter, idle: 15 * 1000 });

		collector.on("collect", async i => {
			if (i.isStringSelectMenu() && i.customId === "help_category_select") {
				i.deferUpdate();

				const arg = i?.values[0];
				const categoryCommands = commands
					.filter(cmd => cmd.category === arg)
					.map(c => {
						return {
							name: `**${c.command.name}**`,
							value: interaction.translate(`${arg.toLowerCase()}/${c.command.name}:DESCRIPTION`),
						};
					});

				const embed = new EmbedBuilder()
					.setColor(client.config.embed.color)
					.setFooter(client.config.embed.footer)
					.setAuthor({
						name: interaction.translate("general/help:COMMANDS_IN", { category: arg }),
					})
					.addFields(categoryCommands)
					.addFields([
						{
							name: "\u200B",
							value: interaction.translate("general/help:INFO"),
						},
					]);

				return interaction.editReply({
					content: null,
					embeds: [embed],
				});
			}
		});

		collector.on("end", () => {
			return interaction.editReply({
				components: [],
			});
		});
	}

	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").AutocompleteInteraction} interaction
	 * @returns
	 */
	async autocompleteRun(client, interaction) {
		const command = interaction.options.getString("command"),
			commands = [...new Map(client.commands.map(v => [v.constructor.name, v])).values()],
			results = commands.filter(c => c.command.name.includes(command));

		return interaction.respond(
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

	const usage = interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:USAGE`) === "" ? interaction.translate("misc:NO_ARGS") : interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:USAGE`);

	const embed = new EmbedBuilder()
		.setAuthor({
			name: interaction.translate("general/help:CMD_TITLE", {
				cmd: cmd.command.name,
			}),
		})
		.addFields([
			{
				name: interaction.translate("general/help:FIELD_DESCRIPTION"),
				value: interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:DESCRIPTION`),
			},
			{
				name: interaction.translate("general/help:FIELD_USAGE"),
				value: `*${cmd.command.dm_permission === false ? interaction.translate("general/help:GUILD_ONLY") : interaction.translate("general/help:NOT_GUILD_ONLY")}*\n\n` + usage,
			},
			{
				name: interaction.translate("general/help:FIELD_EXAMPLES"),
				value: interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:EXAMPLES`),
			},
			// {
			// 	name: interaction.translate("general/help:FIELD_ALIASES"),
			// 	value: cmd.aliases.length > 0 ? cmd.aliases.map(a => `${a}`).join("\n") : interaction.translate("general/help:NO_ALIAS")
			// },
			{
				name: interaction.translate("general/help:FIELD_PERMISSIONS"),
				value: cmd.command.default_member_permissions > 0 ? interaction.translate(`misc:PERMISSIONS:${getPermName(cmd.command.default_member_permissions)}`) : interaction.translate("general/help:NO_REQUIRED_PERMISSION"),
			},
		])
		.setColor(interaction.client.config.embed.color)
		.setFooter(interaction.client.config.embed.footer);

	return embed;
}

module.exports = Help;
