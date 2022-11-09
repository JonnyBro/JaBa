const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, SelectMenuBuilder } = require("discord.js");
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
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommand(subcommand => subcommand.setName("message")
					.setDescription(client.translate("administration/selectroles:MESSAGE"))
					.addStringOption(option => option.setName("text")
						.setDescription(client.translate("common:MESSAGE"))
						.setRequired(true))
				)
				.addSubcommand(subcommand => subcommand.setName("addrole")
					.setDescription(client.translate("administration/selectroles:ADDROLE"))
					.addChannelOption(option => option.setName("channel")
						.setDescription(client.translate("common:CHANNEL"))
						.setRequired(true))
					.addStringOption(option => option.setName("message_id")
						.setDescription(client.translate("common:MESSAGE_ID"))
						.setRequired(true))
					.addRoleOption(option => option.setName("role")
						.setDescription(client.translate("common:ROLE"))
						.setRequired(true))
				),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad(client) {
		client.on("interactionCreate", interaction => {
			if (!interaction.isSelectMenu()) return;

			if (interaction.customId === "auto_roles") {
				const removed = interaction.component.options.filter(option => {
					return !interaction.values.includes(option.value);
				});

				for (const id of removed) {
					interaction.member.roles.remove(id.value);
				}

				for (const id of interaction.values) {
					interaction.member.roles.add(id);
				}

				interaction.reply({
					content: interaction.translate("administration/selectroles:ROLES_UPDATED", null, { ephemeral: true }),
					ephemeral: true
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
					message_id: message.id
				}, { edit: true });
			});
		} else if (command === "addrole") {
			const channel = interaction.options.getChannel("channel");
			const message_id = interaction.options.getString("message_id");
			const message = await channel.messages.fetch(message_id);
			if (!message || message.author.id !== client.user.id) return interaction.error("administration/selectroles:MESSAGE_ROLE", null, { edit: true });
			const role = interaction.options.getRole("role");

			let row = message.components[0];
			if (!row) row = new ActionRowBuilder();

			const option = [{
				label: role.name,
				value: role.id
			}];

			const menu = row.components[0];
			if (menu) {
				for (const o of menu.options) {
					if (o.value === option[0].value) return interaction.error("administration/selectroles:ALREADY_IN_MENU");
				}

				row = ActionRowBuilder.from(row)
					.setComponents(
						SelectMenuBuilder.from(menu)
							.setMinValues(0)
							.setMaxValues(menu.options.length + 1)
							.addOptions(option)
					);
			} else {
				row.addComponents(
					new SelectMenuBuilder()
						.setCustomId("auto_roles")
						.setMinValues(0)
						.setMaxValues(1)
						.setPlaceholder(interaction.translate("common:AVAILABLE_OPTIONS"))
						.addOptions(option)
				);
			}

			message.edit({
				components: [row]
			});

			interaction.followUp({
				content: interaction.translate("administration/selectroles:SUCCESS_ADDED", {
					role: role.name
				}),
				ephemeral: true
			});
		}
	}
}

module.exports = Selectroles;