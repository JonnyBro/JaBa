const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
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
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers && PermissionFlagsBits.ManageMessages)
				.addSubcommand(subcommand => subcommand.setName("create")
					.setDescription(client.translate("moderation/giveaway:CREATE"))
					.addStringOption(option => option.setName("duration")
						.setDescription(client.translate("common:DURATION"))
						.setRequired(true))
					.addIntegerOption(option => option.setName("winners_count")
						.setDescription(client.translate("moderation/giveaway:WINNERS_COUNT"))
						.setRequired(true))
					.addStringOption(option => option.setName("prize")
						.setDescription(client.translate("moderation/giveaway:PRIZE"))
						.setRequired(true))
					.addBooleanOption(option => option.setName("isdrop")
						.setDescription(client.translate("moderation/giveaway:ISDROP"))
						.setRequired(true)),
				)
				.addSubcommand(subcommand => subcommand.setName("reroll")
					.setDescription(client.translate("moderation/giveaway:REROLL"))
					.addStringOption(option => option.setName("giveaway_id")
						.setDescription(client.translate("moderation/giveaway:GIVEAWAY_ID"))
						.setRequired(true)),
				)
				.addSubcommand(subcommand => subcommand.setName("end")
					.setDescription(client.translate("moderation/giveaway:END"))
					.addStringOption(option => option.setName("giveaway_id")
						.setDescription(client.translate("moderation/giveaway:GIVEAWAY_ID"))
						.setRequired(true)),
				)
				.addSubcommand(subcommand => subcommand.setName("delete")
					.setDescription(client.translate("moderation/giveaway:DELETE"))
					.addStringOption(option => option.setName("giveaway_id")
						.setDescription(client.translate("moderation/giveaway:GIVEAWAY_ID"))
						.setRequired(true)),
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
		const command = interaction.options.getSubcommand();

		if (command === "create") {
			const currentGiveaways = client.giveawaysManager.giveaways.filter(g => g.guildId === interaction.guildId && !g.ended).length;
			if (currentGiveaways > 5) return interaction.error("moderation/giveaway:MAX_COUNT");

			const duration = interaction.options.getString("duration");
			if (ms(duration) > ms("10d")) return interaction.error("moderation/giveaway:MAX_DURATION");

			const winnersCount = interaction.options.getInteger("winners_count");
			if (winnersCount > 10 || winnersCount < 1) return interaction.error("misc:INVALID_NUMBER_RANGE", { min: 1, max: 10 });

			const prize = interaction.options.getString("prize");
			const isdrop = interaction.options.getBoolean("isdrop");

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
					hostedBy: interaction.translate("moderation/giveaway:HOSTED_BY"),
				},
			}).then(() => {
				return interaction.success("moderation/giveaway:GIVEAWAY_CREATED", null, { ephemeral: true });
			});
		} else if (command === "reroll") {
			const giveaway_id = interaction.options.getString("giveaway_id");

			client.giveawaysManager.reroll(giveaway_id, {
				messages: {
					congrat: interaction.translate("moderation/giveaway:REROLL_CONGRAT"),
					error: interaction.translate("moderation/giveaway:REROLL_ERROR"),
				},
			}).then(() => {
				return interaction.success("moderation/giveaway:GIVEAWAY_REROLLED");
			}).catch(() => {
				return interaction.error("moderation/giveaway:NOT_FOUND_ENDED", {
					messageId: giveaway_id,
				}, { ephemeral: true });
			});
		} else if (command === "end") {
			const giveaway_id = interaction.options.getString("giveaway_id");

			try {
				client.giveawaysManager.end(giveaway_id);
				return interaction.success("moderation/giveaway:GIVEAWAY_ENDED");
			} catch (e) {
				return interaction.error("moderation/giveaway:NOT_FOUND", {
					messageId: giveaway_id,
				}, { ephemeral: true });
			}
		} else if (command === "delete") {
			const giveaway_id = interaction.options.getString("giveaway_id");

			client.giveawaysManager.delete(giveaway_id).then(() => {
				return interaction.success("moderation/giveaway:GIVEAWAY_DELETED");
			}).catch(() => {
				return interaction.error("moderation/giveaway:NOT_FOUND", {
					messageId: giveaway_id,
				}, { ephemeral: true });
			});
		}
	}
}

module.exports = Giveaway;