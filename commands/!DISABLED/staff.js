const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Staff extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("staff")
				.setDescription(client.translate("general/staff:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/staff:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/staff:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.guild.members.fetch();

		const administrators = interaction.guild.members.cache.filter(m => m.permissions.has(PermissionsBitField.Flags.Administrator) && !m.user.bot);
		const moderators = interaction.guild.members.cache.filter(m => !administrators.has(m.id) && m.permissions.has(PermissionsBitField.Flags.ManageMessages) && !m.user.bot);

		const embed = client.embed({
			author: {
				name: interaction.translate("general/staff:TITLE", {
					guild: interaction.guild.name,
				}),
				iconURL: interaction.guild.iconURL(),
			},
			fields: [
				{
					name: interaction.translate("general/staff:ADMINS"),
					value:
						administrators.size > 0
							? administrators.map(a => `${a.presence ? client.customEmojis.status[a.presence.status] : client.customEmojis.status.offline} | <@${a.user.id}>`).join("\n")
							: interaction.translate("general/staff:NO_ADMINS"),
				},
				{
					name: interaction.translate("general/staff:MODS"),
					value: moderators.size > 0 ? moderators.map(m => `${m.presence ? client.customEmojis.status[m.presence.status] : client.customEmojis.status.offline} | <@${m.user.id}>`).join("\n") : interaction.translate("general/staff:NO_MODS"),
				},
			],
		});

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Staff;
