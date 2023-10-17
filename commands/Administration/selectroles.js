const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Selectroles extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("selectroles")
				.setDescription(client.translate("administration/selectroles:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("administration/selectroles:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("administration/selectroles:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addSubcommand(subcommand =>
					subcommand
						.setName("message")
						.setDescription(client.translate("administration/selectroles:MESSAGE"))
						.setDescriptionLocalizations({
							uk: client.translate("administration/selectroles:MESSAGE", null, "uk-UA"),
							ru: client.translate("administration/selectroles:MESSAGE", null, "ru-RU"),
						})
						.addStringOption(option =>
							option
								.setName("text")
								.setDescription(client.translate("common:MESSAGE"))
								.setDescriptionLocalizations({
									uk: client.translate("common:MESSAGE", null, "uk-UA"),
									ru: client.translate("common:MESSAGE", null, "ru-RU"),
								})
								.setRequired(true),
						),
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName("addrole")
						.setDescription(client.translate("administration/selectroles:ADDROLE"))
						.setDescriptionLocalizations({
							uk: client.translate("administration/selectroles:ADDROLE", null, "uk-UA"),
							ru: client.translate("administration/selectroles:ADDROLE", null, "ru-RU"),
						})
						.addChannelOption(option =>
							option
								.setName("channel")
								.setDescription(client.translate("common:CHANNEL"))
								.setDescriptionLocalizations({
									uk: client.translate("common:CHANNEL", null, "uk-UA"),
									ru: client.translate("common:CHANNEL", null, "ru-RU"),
								})
								.setRequired(true),
						)
						.addStringOption(option =>
							option
								.setName("message_id")
								.setDescription(client.translate("common:MESSAGE_ID"))
								.setDescriptionLocalizations({
									uk: client.translate("common:MESSAGE_ID", null, "uk-UA"),
									ru: client.translate("common:MESSAGE_ID", null, "ru-RU"),
								})
								.setRequired(true),
						)
						.addRoleOption(option =>
							option
								.setName("role")
								.setDescription(client.translate("common:ROLE"))
								.setDescriptionLocalizations({
									uk: client.translate("common:ROLE", null, "uk-UA"),
									ru: client.translate("common:ROLE", null, "ru-RU"),
								})
								.setRequired(true),
						),
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
	async onLoad(client) {
		client.on("interactionCreate", async interaction => {
			if (!interaction.isStringSelectMenu()) return;

			if (interaction.customId === "auto_roles") {
				const removed = interaction.component.options.filter(option => {
					return !interaction.values.includes(option.value);
				});

				for (const id of removed) {
					await interaction.member.roles.remove(id.value);
				}

				for (const id of interaction.values) {
					await interaction.member.roles.add(id);
				}

				interaction.reply({
					content: interaction.translate("administration/selectroles:ROLES_UPDATED"),
					ephemeral: true,
				});
			}
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const command = interaction.options.getSubcommand();

		if (command === "message") {
			const text = interaction.options.getString("text");

			interaction.channel.send(text).then(message => {
				interaction.success("administration/selectroles:MESSAGE_SENT", {
					channel: interaction.channel.toString(),
					message_id: message.id,
				}, { edit: true });
			});
		} else if (command === "addrole") {
			const channel = interaction.options.getChannel("channel"),
				message_id = interaction.options.getString("message_id"),
				message = await channel.messages.fetch(message_id);

			if (!message || message.author.id !== client.user.id) return interaction.error("administration/selectroles:MESSAGE_ROLE", null, { edit: true });
			const role = interaction.options.getRole("role");

			let row = message.components[0];
			if (!row) row = new ActionRowBuilder();

			const option = [
				{
					label: role.name,
					value: role.id,
				},
			];

			const menu = row.components[0];
			if (menu) {
				for (const o of menu.options) {
					if (o.value === option[0].value) return interaction.error("administration/selectroles:ALREADY_IN_MENU", null, { edit: true });
				}

				row = ActionRowBuilder.from(row).setComponents(
					StringSelectMenuBuilder.from(menu)
						.setMinValues(0)
						.setMaxValues(menu.options.length + 1)
						.addOptions(option),
				);
			} else {
				row.addComponents(new StringSelectMenuBuilder().setCustomId("auto_roles").setMinValues(0).setMaxValues(1).setPlaceholder(interaction.translate("common:AVAILABLE_OPTIONS")).addOptions(option));
			}

			message.edit({
				components: [row],
			});

			interaction.followUp({
				content: interaction.translate("administration/selectroles:SUCCESS_ADDED", {
					role: role.name,
				}),
				ephemeral: true,
			});
		}
	}
}

module.exports = Selectroles;
