const { ApplicationCommandType, PermissionFlagsBits, EmbedBuilder, ContextMenuCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Warns extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor() {
		super({
			command: new ContextMenuCommandBuilder()
				.setName("warns")
				.setType(ApplicationCommandType.User)
				.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers && PermissionFlagsBits.ManageMessages),
			aliases: [],
			dirname: __dirname,
			guildOnly: true
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
	 * @param {import("discord.js").UserContextMenuCommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const member = interaction.targetMember;
		if (member.user.bot) return;

		const memberData = await client.findOrCreateMember({
			id: member.id,
			guildID: interaction.guildId
		});

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("moderation/warns:SANCTIONS_OF", {
					member: member.nickname || member.user.username
				}),
				iconURL: member.displayAvatarURL({
					size: 512,
					format: "png"
				})
			})
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			});

		if (memberData.sanctions.length < 1) {
			embed.setDescription(interaction.translate("moderation/warns:NO_SANCTION", {
				member: member.nickname || member.user.username
			}));
			return interaction.reply({
				embeds: [embed]
			});
		} else {
			memberData.sanctions.forEach((s) => {
				embed.addFields([
					{
						name: s.type + " | #" + s.case,
						value: `${interaction.translate("common:MODERATOR")}: <@${s.moderator}>\n${interaction.translate("common:REASON")}: ${s.reason}`,
						inline: true
					}
				]);
			});
		}
		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Warns;