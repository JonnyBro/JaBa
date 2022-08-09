const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Staff extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("staff")
				.setDescription(client.translate("general/staff:DESCRIPTION")),
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
		await interaction.guild.members.fetch();
		const administrators = interaction.guild.members.cache.filter((m) => m.permissions.has(PermissionsBitField.Flags.Administrator) && !m.user.bot);
		const moderators = interaction.guild.members.cache.filter((m) => !administrators.has(m.id) && m.permissions.has(PermissionsBitField.Flags.ManageMessages) && !m.user.bot);
		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("general/staff:TITLE", {
					guild: interaction.guild.name
				})
			})
			.addFields([
				{
					name: interaction.translate("general/staff:ADMINS"),
					value: (administrators.size > 0 ? administrators.map((a) => `${a.presence ? client.customEmojis.status[a.presence.status] : client.customEmojis.status.offline} | <@${a.user.id}>`).join("\n") : interaction.translate("general/staff:NO_ADMINS"))
				},
				{
					name: interaction.translate("general/staff:MODS"),
					value: (moderators.size > 0 ? moderators.map((m) => `${m.presence ? client.customEmojis.status[m.presence.status] : client.customEmojis.status.offline} | <@${m.user.id}>`).join("\n") : interaction.translate("general/staff:NO_MODS"))
				}
			])
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			});

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Staff;