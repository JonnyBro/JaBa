const { SlashCommandBuilder, PermissionsBitField, InteractionContextType } = require("discord.js");
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
				.setContexts([InteractionContextType.Guild])
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
		const member = interaction.options.getMember("user");
		if (member.user.bot) return interaction.error("misc:BOT_USER");

		const memberData = await client.getMemberData(member.id, interaction.guildId);

		const embed = client.embed({
			author: {
				name: interaction.translate("moderation/warns:SANCTIONS_OF", {
					member: member.user.getUsername(),
				}),
				iconURL: member.displayAvatarURL(),
			},
		});

		if (memberData.sanctions.length === 0) {
			embed.data.description = interaction.translate("moderation/warns:NO_SANCTIONS", {
				member: member.user.getUsername(),
			});

			return interaction.reply({
				embeds: [embed],
			});
		} else {
			memberData.sanctions.forEach(sanction => {
				embed.data.fields.push({
					name: sanction.type,
					value: `${interaction.translate("common:MODERATOR")}: <@${sanction.moderator}>\n${interaction.translate("common:REASON")}: ${sanction.reason}`,
					inline: true,
				});
			});
		}

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Warns;
