const { ContextMenuCommandBuilder, ModalBuilder, EmbedBuilder, ActionRowBuilder, TextInputBuilder, ApplicationCommandType, PermissionsBitField, TextInputStyle } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class WarnContext extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor() {
		super({
			command: new ContextMenuCommandBuilder()
				.setName("Give Warn")
				.setType(ApplicationCommandType.User)
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
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
	 * @param {import("discord.js").UserContextMenuCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		const member = interaction.targetMember,
			memberPosition = member.roles.highest.position,
			moderationPosition = interaction.member.roles.highest.position;

		if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true });
		if (member.id === interaction.member.id) return interaction.error("moderation/warn:YOURSELF", null, { ephemeral: true });
		if (interaction.guild.ownerId !== interaction.member.id && !(moderationPosition > memberPosition)) return interaction.error("moderation/warn:SUPERIOR", null, { ephemeral: true });

		const memberData = await client.findOrCreateMember({
			id: member.id,
			guildId: interaction.guildId,
		});

		const modal = new ModalBuilder()
			.setCustomId("warn_modal")
			.setTitle(interaction.translate("moderation/warn:MODAL_TITLE", {
				nickname: member.user.getUsername(),
			}).normalize("NFKD"));

		const reasonInput = new TextInputBuilder()
			.setCustomId("warn_reason")
			.setLabel(interaction.translate("moderation/warn:MODAL_REASON"))
			.setMinLength(5)
			.setMaxLength(200)
			.setRequired(true)
			.setStyle(TextInputStyle.Short);

		modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

		await interaction.showModal(modal);

		const submitted = await interaction
			.awaitModalSubmit({
				time: 2 * 60 * 1000,
				filter: i => i.user.id === interaction.member.id && i.customId === "warn_modal",
			})
			.catch(() => {
				interaction.followUp({
					content: interaction.translate("misc:TIMED_OUT"),
					ephemeral: true,
				});
			});

		if (submitted) {
			const reason = submitted.fields.getTextInputValue("warn_reason");

			// const sanctions = memberData.sanctions.filter(s => s.type === "warn").length;
			// const banCount = data.guildData.plugins.warnsSanctions.ban;
			// const kickCount = data.guildData.plugins.warnsSanctions.kick;

			const caseInfo = {
				moderator: interaction.member.id,
				date: Date.now(),
				type: "warn",
				reason,
			};

			const embed = new EmbedBuilder().addFields([
				{
					name: interaction.translate("common:USER"),
					value: `\`${member.user.getUsername()}\` (${member.user.toString()})`,
				},
				{
					name: interaction.translate("common:MODERATOR"),
					value: `\`${interaction.user.getUsername()}\` (${interaction.user.toString()})`,
				},
				{
					name: interaction.translate("common:REASON"),
					value: reason,
					inline: true,
				},
			]);
			/*
			if (banCount) {
				if (sanctions >= banCount) {
					member.send({
						content: interaction.translate("moderation/ban:BANNED_DM", {
							user: member.user,
							moderator: interaction.user.getUsername(),
							server: interaction.guild.name,
							reason,
						}),
					});

					caseInfo.type = "ban";

					embed
						.setAuthor({
							name: interaction.translate("moderation/warn:BAN"),
						})
						.setColor(client.config.embed.color);

					interaction.guild.members.ban(member).catch(() => {});

					interaction.followUp({
						content: interaction.translate("moderation/setwarns:AUTO_BAN", {
							user: member.user.getUsername(),
							count: `${banCount} ${client.functions.getNoun(banCount, interaction.translate("misc:NOUNS:WARNS:1"), interaction.translate("misc:NOUNS:WARNS:2"), interaction.translate("misc:NOUNS:WARNS:5"))}`,
						}),
					});
				}
			}

			if (kickCount) {
				if (sanctions >= kickCount) {
					member.send({
						content: interaction.translate("moderation/kick:KICKED_DM", {
							user: member.user,
							moderator: interaction.user.getUsername(),
							server: interaction.guild.name,
							reason,
						}),
					});

					caseInfo.type = "kick";

					embed
						.setAuthor({
							name: interaction.translate("moderation/warn:KICK"),
						})
						.setColor(client.config.embed.color);

					member.kick().catch(() => {});

					interaction.followUp({
						content: interaction.translate("moderation/setwarns:AUTO_KICK", {
							user: member.user.getUsername(),
							count: `${kickCount} ${client.functions.getNoun(kickCount, interaction.translate("misc:NOUNS:WARNS:1"), interaction.translate("misc:NOUNS:WARNS:2"), interaction.translate("misc:NOUNS:WARNS:5"))}`,
						}),
					});
				}
			}
			*/
			member.send({
				content: interaction.translate("moderation/warn:WARNED_DM", {
					user: member.user.getUsername(),
					server: interaction.guild.name,
					moderator: interaction.user.getUsername(),
					reason,
				}),
			});

			embed
				.setAuthor({
					name: interaction.translate("moderation/warn:WARN"),
				})
				.setColor(client.config.embed.color);

			memberData.sanctions.push(caseInfo);

			memberData.markModified("sanctions");
			await memberData.save();

			if (data.guildData.plugins.modlogs) {
				const channel = interaction.guild.channels.cache.get(data.guildData.plugins.modlogs);
				if (!channel) return;

				channel.send({
					embeds: [embed],
				});
			}

			return submitted.reply({
				content: interaction.translate("moderation/warn:WARNED", {
					user: member.toString(),
					reason,
				}),
			});
		}
	}
}

module.exports = WarnContext;
