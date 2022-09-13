const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, PermissionsBitField } = require("discord.js");
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
				.addStringOption(option =>
					option.setName("command")
						.setDescription(client.translate("owner/reload:COMMAND"))),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: false
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
			const embed = generateCommandHelp(interaction, command);

			return interaction.editReply({
				embeds: [embed]
			});
		}

		commands.forEach(c => {
			if (!categories.includes(c.category)) {
				if (c.category === "Owner" && interaction.member.id !== client.config.owner.id) return;
				categories.push(c.category);
			}
		});

		const categoriesRows = categories.sort().map(c => {
			return {
				label: `${c} (${commands.filter(cmd => cmd.category === c).length})`,
				value: c
			};
		});

		const row = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId("help_category_select")
					.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
					.addOptions(categoriesRows)
			);

		await interaction.editReply({
			content: interaction.translate("common:AVAILABLE_OPTIONS"),
			components: [row]
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (15 * 1000) });

		collector.on("collect", async i => {
			if (i.isSelectMenu() && (i.customId === "help_category_select" || i.customId === "help_commands_select")) {
				i.deferUpdate();

				const arg = i?.values[0];

				if (categories.includes(arg)) {
					const categoryCommands = commands.filter(cmd => cmd.category === arg).map(c => {
						return {
							label: c.command.name,
							value: c.command.name
						};
					});

					const commandsRow = new ActionRowBuilder()
						.addComponents(
							new SelectMenuBuilder()
								.setCustomId("help_commands_select")
								.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
								.addOptions(categoryCommands)
						);

					return await interaction.editReply({
						content: interaction.translate("general/help:COMMANDS_IN", {
							category: arg
						}),
						components: [commandsRow]
					});
				} else {
					const embed = generateCommandHelp(interaction, arg);
					return interaction.editReply({
						content: null,
						components: [],
						embeds: [embed]
					});
				}
			}
		});

		collector.on("end", () => {
			return interaction.editReply({
				components: []
			});
		});
	}
}

function getPermName(bitfield = 0) {
	for (const key in PermissionsBitField.Flags)
		if (PermissionsBitField.Flags[key] === BigInt(bitfield)) return key;
	return null;
}

function generateCommandHelp(interaction, command) {
	const cmd = interaction.client.commands.get(command);
	if (!cmd) return interaction.error("general/help:NOT_FOUND", { search: command }, { edit: true });
	const usage = interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:USAGE`) === "" ?
		interaction.translate("misc:NO_ARGS")
		: interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:USAGE`);

	const embed = new EmbedBuilder()
		.setAuthor({
			name: interaction.translate("general/help:CMD_TITLE", {
				cmd: cmd.command.name
			})
		})
		.addFields([
			{
				name: interaction.translate("general/help:FIELD_DESCRIPTION"),
				value: interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:DESCRIPTION`)
			},
			{
				name: interaction.translate("general/help:FIELD_USAGE"),
				value: usage
			},
			{
				name: interaction.translate("general/help:FIELD_EXAMPLES"),
				value: interaction.translate(`${cmd.category.toLowerCase()}/${cmd.command.name}:EXAMPLES`)
			},
			{
				name: interaction.translate("general/help:FIELD_ALIASES"),
				value: cmd.aliases.length > 0 ? cmd.aliases.map(a => `${a}`).join("\n") : interaction.translate("general/help:NO_ALIAS")
			},
			{
				name: interaction.translate("general/help:FIELD_PERMISSIONS"),
				value: cmd.command.default_member_permissions > 0 ? interaction.translate(`misc:PERMISSIONS:${getPermName(cmd.command.default_member_permissions)}`) : interaction.translate("general/help:NO_REQUIRED_PERMISSION")
			}
		])
		.setColor(interaction.client.config.embed.color)
		.setFooter({
			text: interaction.client.config.embed.footer
		});

	return embed;
}

module.exports = Help;