const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, TextInputStyle, ModalBuilder, EmbedBuilder, ActionRowBuilder, TextInputBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Warn extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor() {
		super({
			command: new ContextMenuCommandBuilder()
				.setName("warn")
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
	async execute(client, interaction, data) {
		const member = interaction.targetMember;
		if (member.user.bot) return;

		const memberData = await client.findOrCreateMember({
			id: member.id,
			guildID: interaction.guildId
		});

		if (member.id === interaction.user.id) return interaction.error("moderation/warn:YOURSELF");

		const memberPosition = member.roles.highest.position;
		const moderationPosition = interaction.member.roles.highest.position;
		if (interaction.guild.ownerId !== interaction.user.id && !(moderationPosition > memberPosition)) return interaction.error("moderation/ban:SUPERIOR");

		const modal = new ModalBuilder()
			.setCustomId("warn_modal")
			.setTitle(interaction.translate("moderation/warn:MODAL_TITLE"));

		const reasonInput = new TextInputBuilder()
			.setCustomId("reason")
			.setLabel(interaction.translate("moderation/warn:REASON"))
			.setStyle(TextInputStyle.Short);

		const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);

		modal.addComponents(firstActionRow);

		await interaction.showModal(modal);

		const submitted = await interaction.awaitModalSubmit({
			time: 120000,
			filter: i => i.user.id === interaction.user.id,
		});

		if (submitted) {
			const reason = submitted.fields.getTextInputValue("reason");

			const sanctions = memberData.sanctions.filter((s) => s.type === "warn").length;
			const banCount = data.guildData.plugins.warnsSanctions.ban;
			const kickCount = data.guildData.plugins.warnsSanctions.kick;

			data.guildData.casesCount++;
			data.guildData.save();

			const caseInfo = {
				moderator: interaction.user.id,
				date: Date.now(),
				type: "warn",
				case: data.guildData.casesCount,
				reason
			};

			const embed = new EmbedBuilder()
				.addFields([
					{
						name: interaction.translate("common:USER"),
						value: `\`${member.user.tag}\` (${member.user.toString()})`
					},
					{
						name: interaction.translate("common:MODERATOR"),
						value: `\`${interaction.user.tag}\` (${interaction.user.toString()})`
					},
					{
						name: interaction.translate("common:REASON"),
						value: reason,
						inline: true
					}
				]);

			if (banCount) {
				if (sanctions >= banCount) {
					member.send({
						content: interaction.translate("moderation/ban:BANNED_DM", {
							username: member.user,
							moderator: interaction.user.tag,
							server: interaction.guild.name,
							reason
						})
					});
					caseInfo.type = "ban";
					embed.setAuthor({
						name: interaction.translate("moderation/ban:CASE", {
							count: data.guildData.casesCount
						})
					})
						.setColor("#e02316");
					interaction.guild.members.ban(member);
					interaction.success("moderation/setwarns:AUTO_BAN", {
						username: member.user.tag,
						count: `${banCount} ${client.getNoun(banCount, interaction.translate("misc:NOUNS:WARNS:1"), interaction.translate("misc:NOUNS:WARNS:2"), interaction.translate("misc:NOUNS:WARNS:5"))}`
					});
				}
			}

			if (kickCount) {
				if (sanctions >= kickCount) {
					member.send({
						content: interaction.translate("moderation/kick:KICKED_DM", {
							username: member.user,
							moderator: interaction.user.tag,
							server: interaction.guild.name,
							reason
						})
					});
					caseInfo.type = "kick";
					embed.setAuthor({
						name: interaction.translate("moderation/kick:CASE", {
							count: data.guildData.casesCount
						})
					})
						.setColor("#e88709");
					member.kick().catch(() => {});
					interaction.success("moderation/setwarns:AUTO_KICK", {
						username: member.user.tag,
						count: `${kickCount} ${client.getNoun(kickCount, interaction.translate("misc:NOUNS:WARNS:1"), interaction.translate("misc:NOUNS:WARNS:2"), interaction.translate("misc:NOUNS:WARNS:5"))}`
					});
				}
			}

			member.send({
				content: interaction.translate("moderation/warn:WARNED_DM", {
					username: member.user.tag,
					server: interaction.guild.name,
					moderator: interaction.user.tag,
					reason
				})
			});

			caseInfo.type = "warn";
			embed.setAuthor({
				name: interaction.translate("moderation/warn:CASE", {
					caseNumber: data.guildData.casesCount
				})
			}).setColor("#8c14e2");

			submitted.reply({
				content: interaction.translate("moderation/warn:WARNED", {
					username: member.user.tag,
					reason
				})
			});

			memberData.sanctions.push(caseInfo);
			memberData.save();

			if (data.guildData.plugins.modlogs) {
				const channel = interaction.guild.channels.cache.get(data.guildData.plugins.modlogs);
				if (!channel) return;
				channel.send({
					embeds: [embed]
				});
			}
		}
	}
}

module.exports = Warn;