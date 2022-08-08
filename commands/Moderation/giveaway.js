const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, InteractionCollector, ComponentType, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	ms = require("ms");

class Giveaway extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("giveaway")
				.setDescription(client.translate("moderation/giveaway:DESCRIPTION"))
				.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers && PermissionFlagsBits.ManageMessages)
				.addStringOption(option => option.setName("giveaway_id")
					.setDescription(client.translate("moderation/giveaway:GIVEAWAY_ID")))
				.addStringOption(option => option.setName("duration")
					.setDescription(client.translate("common:DURATION")))
				.addStringOption(option => option.setName("winners_count")
					.setDescription(client.translate("moderation/giveaway:WINNERS_COUNT")))
				.addStringOption(option => option.setName("prize")
					.setDescription(client.translate("moderation/giveaway:PRIZE")))
				.addBooleanOption(option => option.setName("isdrop")
					.setDescription(client.translate("moderation/giveaway:ISDROP"))),
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
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const options = ["create", "reroll", "delete", "end"].map(tag =>
			JSON.parse(JSON.stringify({
				label: tag,
				value: tag
			}))
		);

		const row = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId("giveaway_select")
					.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
					.addOptions(options)
			);

		const msg = await interaction.reply({
			content: interaction.translate("common:AVAILABLE_OPTIONS"),
			components: [row],
			ephemeral: true,
			fetchReply: true
		});

		const filter = i => i.customId === "giveaway_select" && i.user.id === interaction.user.id;
		const collector = new InteractionCollector(client, {
			filter,
			componentType: ComponentType.SelectMenu,
			message: msg,
			idle: 30 * 1000
		});

		collector.on("collect", async i => {
			const option = i?.values[0];

			if (option === "create") {
				const currentGiveaways = client.giveawaysManager.giveaways.filter(g => g.guildId === interaction.guild.id && !g.ended).length;
				if (currentGiveaways > 5) return i.update({ content: interaction.translate("moderation/giveaway:MAX_COUNT") });

				const duration = interaction.options.getString("duration");
				if (!duration) return i.update({ content: interaction.translate("moderation/giveaway:INVALID_CREATE") });
				if (ms(duration) > ms("10d")) return i.update({ content: interaction.translate("moderation/giveaway:MAX_DURATION") });

				const winnersCount = interaction.options.getString("winners_count");
				if (!winnersCount) return i.update({ content: interaction.translate("moderation/giveaway:INVALID_CREATE") });
				if (isNaN(winnersCount) || winnersCount > 10 || winnersCount < 1) return i.update({ content: interaction.translate("misc:INVALID_NUMBER_RANGE", { min: 1, max: 10 }) });

				const prize = interaction.options.getString("prize");
				if (!prize) return i.update({ content: interaction.translate("moderation/giveaway:INVALID_CREATE") });
				const isdrop = interaction.options.getString("isdrop");

				client.giveawaysManager.start(interaction.channel, {
					duration: ms(duration),
					winnerCount: winnersCount,
					prize: prize,
					hostedBy: interaction.user,
					isDrop: isdrop,
					messages: {
						giveaway: interaction.translate("moderation/giveaway:TITLE"),
						giveawayEnded: interaction.translate("moderation/giveaway:ENDED"),
						timeRemaining: interaction.translate("moderation/giveaway:TIME_REMAINING"),
						inviteToParticipate: interaction.translate("moderation/giveaway:INVITE_PARTICIPATE"),
						winMessage: interaction.translate("moderation/giveaway:WIN_MESSAGE"),
						drawing: interaction.translate("moderation/giveaway:DRAWING"),
						dropMessage: interaction.translate("moderation/giveaway:DROP"),
						embedFooter: interaction.translate("moderation/giveaway:FOOTER"),
						noWinner: interaction.translate("moderation/giveaway:NO_WINNER"),
						winners: interaction.translate("moderation/giveaway:WINNERS"),
						endedAt: interaction.translate("moderation/giveaway:END_AT"),
						hostedBy: interaction.translate("moderation/giveaway:HOSTEDBY"),
						// units: {
						// 	seconds: interaction.translate("time:SECONDS", {
						// 		amount: ""
						// 	}).trim(),
						// 	minutes: interaction.translate("time:MINUTES", {
						// 		amount: ""
						// 	}).trim(),
						// 	hours: interaction.translate("time:HOURS", {
						// 		amount: ""
						// 	}).trim(),
						// 	days: interaction.translate("time:DAYS", {
						// 		amount: ""
						// 	}).trim()
						// }
					}
				}).then(() => {
					return i.update({
						content: interaction.translate("moderation/giveaway:GIVEAWAY_CREATED"),
						components: []
					});
				});
			} else if (option === "reroll") {
				const giveaway_id = interaction.options.getString("giveaway_id");
				if (!giveaway_id) return i.update({ content: interaction.translate("moderation/giveaway:MISSING_ID"), components: [] });

				client.giveawaysManager.reroll(giveaway_id, {
					messages: {
						congrat: interaction.translate("moderation/giveaway:REROLL_CONGRAT"),
						error: interaction.translate("moderation/giveaway:REROLL_ERROR")
					}
				}).then(() => {
					return i.update({
						content: interaction.translate("moderation/giveaway:GIVEAWAY_REROLLED"),
						components: []
					});
				}).catch(() => {
					return i.update({
						content: interaction.translate("moderation/giveaway:NOT_FOUND_ENDED", {
							messageId: giveaway_id
						}),
						components: []
					});
				});
			} else if (option === "delete") {
				const giveaway_id = interaction.options.getString("giveaway_id");
				if (!giveaway_id) return i.update({ content: interaction.translate("moderation/giveaway:MISSING_ID"), components: [] });

				client.giveawaysManager.delete(giveaway_id).then(() => {
					return i.update({
						content: interaction.translate("moderation/giveaway:GIVEAWAY_DELETED"),
						components: []
					});
				}).catch(() => {
					return i.update({
						content: interaction.translate("moderation/giveaway:NOT_FOUND", {
							messageId: giveaway_id
						}),
						components: []
					});
				});
			} else if (option === "end") {
				const giveaway_id = interaction.options.getString("giveaway_id");
				if (!giveaway_id) return i.update({ content: interaction.translate("moderation/giveaway:MISSING_ID"), components: [] });

				try {
					client.giveawaysManager.end(giveaway_id);
					return i.update({
						content: interaction.translate("moderation/giveaway:GIVEAWAY_ENDED"),
						components: []
					});
				} catch (e) {
					return i.update({
						content: interaction.translate("moderation/giveaway:NOT_FOUND", {
							messageId: giveaway_id
						}),
						components: []
					});
				}
			}
		});
	}
}

module.exports = Giveaway;