const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Warns extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("warns")
				.setDescription(client.translate("moderation/warns:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("moderation/warns:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("moderation/warns:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
						})
						.setRequired(true),
				),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
		});
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		const member = interaction.options.getMember("user");
		if (member.user.bot) return interaction.error("misc:BOT_USER");

		const memberData = await client.findOrCreateMember({
			id: member.id,
			guildId: interaction.guildId,
		});

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("moderation/warns:SANCTIONS_OF", {
					member: member.user.getUsername(),
				}),
				iconURL: member.displayAvatarURL(),
			})
			.setColor(client.config.embed.color)
			.setFooter(client.config.embed.footer);

		if (memberData.sanctions.length === 0) {
			embed.setDescription(
				interaction.translate("moderation/warns:NO_SANCTIONS", {
					member: member.user.getUsername(),
				}),
			);
			return interaction.reply({
				embeds: [embed],
			});
		} else {
			memberData.sanctions.forEach(sanction => {
				embed.addFields([
					{
						name: sanction.type,
						value: `${interaction.translate("common:MODERATOR")}: <@${sanction.moderator}>\n${interaction.translate("common:REASON")}: ${sanction.reason}`,
						inline: true,
					},
				]);
			});
		}

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Warns;
