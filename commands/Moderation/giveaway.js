const { SlashCommandBuilder, PermissionsBitField, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	ms = require("ms");

class Giveaway extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("giveaway")
				.setDescription(client.translate("moderation/giveaway:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("moderation/giveaway:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("moderation/giveaway:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
				.addSubcommand(subcommand =>
					subcommand
						.setName("create")
						.setDescription(client.translate("moderation/giveaway:CREATE"))
						.setDescriptionLocalizations({
							uk: client.translate("moderation/giveaway:CREATE", null, "uk-UA"),
							ru: client.translate("moderation/giveaway:CREATE", null, "ru-RU"),
						})
						.addStringOption(option =>
							option
								.setName("duration")
								.setDescription(client.translate("common:DURATION"))
								.setDescriptionLocalizations({
									uk: client.translate("common:DURATION", null, "uk-UA"),
									ru: client.translate("common:DURATION", null, "ru-RU"),
								})
								.setRequired(true),
						)
						.addIntegerOption(option =>
							option
								.setName("winners_count")
								.setDescription(client.translate("moderation/giveaway:WINNERS_COUNT"))
								.setDescriptionLocalizations({
									uk: client.translate("moderation/giveaway:WINNERS_COUNT", null, "uk-UA"),
									ru: client.translate("moderation/giveaway:WINNERS_COUNT", null, "ru-RU"),
								})
								.setRequired(true),
						)
						.addStringOption(option =>
							option
								.setName("prize")
								.setDescription(client.translate("moderation/giveaway:PRIZE"))
								.setDescriptionLocalizations({
									uk: client.translate("moderation/giveaway:PRIZE", null, "uk-UA"),
									ru: client.translate("moderation/giveaway:PRIZE", null, "ru-RU"),
								})
								.setRequired(true),
						)
						.addBooleanOption(option =>
							option
								.setName("isdrop")
								.setDescription(client.translate("moderation/giveaway:ISDROP"))
								.setDescriptionLocalizations({
									uk: client.translate("moderation/giveaway:ISDROP", null, "uk-UA"),
									ru: client.translate("moderation/giveaway:ISDROP", null, "ru-RU"),
								})
								.setRequired(true),
						),
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName("reroll")
						.setDescription(client.translate("moderation/giveaway:REROLL"))
						.setDescriptionLocalizations({
							uk: client.translate("moderation/giveaway:REROLL", null, "uk-UA"),
							ru: client.translate("moderation/giveaway:REROLL", null, "ru-RU"),
						})
						.addStringOption(option =>
							option
								.setName("giveaway_id")
								.setDescription(client.translate("moderation/giveaway:GIVEAWAY_ID"))
								.setDescriptionLocalizations({
									uk: client.translate("moderation/giveaway:GIVEAWAY_ID", null, "uk-UA"),
									ru: client.translate("moderation/giveaway:GIVEAWAY_ID", null, "ru-RU"),
								})
								.setRequired(true),
						),
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName("end")
						.setDescription(client.translate("moderation/giveaway:END"))
						.setDescriptionLocalizations({
							uk: client.translate("moderation/giveaway:END", null, "uk-UA"),
							ru: client.translate("moderation/giveaway:END", null, "ru-RU"),
						})
						.addStringOption(option =>
							option
								.setName("giveaway_id")
								.setDescription(client.translate("moderation/giveaway:GIVEAWAY_ID"))
								.setDescriptionLocalizations({
									uk: client.translate("moderation/giveaway:GIVEAWAY_ID", null, "uk-UA"),
									ru: client.translate("moderation/giveaway:GIVEAWAY_ID", null, "ru-RU"),
								})
								.setRequired(true),
						),
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName("delete")
						.setDescription(client.translate("moderation/giveaway:DELETE"))
						.setDescriptionLocalizations({
							uk: client.translate("moderation/giveaway:DELETE", null, "uk-UA"),
							ru: client.translate("moderation/giveaway:DELETE", null, "ru-RU"),
						})
						.addStringOption(option =>
							option
								.setName("giveaway_id")
								.setDescription(client.translate("moderation/giveaway:GIVEAWAY_ID"))
								.setDescriptionLocalizations({
									uk: client.translate("moderation/giveaway:GIVEAWAY_ID", null, "uk-UA"),
									ru: client.translate("moderation/giveaway:GIVEAWAY_ID", null, "ru-RU"),
								})
								.setRequired(true),
						),
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

			client.giveawaysManager
				.start(interaction.channel, {
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
				})
				.then(() => {
					return interaction.success("moderation/giveaway:GIVEAWAY_CREATED", null, { ephemeral: true });
				});
		} else if (command === "reroll") {
			const giveaway_id = interaction.options.getString("giveaway_id");

			client.giveawaysManager
				.reroll(giveaway_id, {
					messages: {
						congrat: interaction.translate("moderation/giveaway:REROLL_CONGRAT"),
						error: interaction.translate("moderation/giveaway:REROLL_ERROR"),
					},
				})
				.then(() => {
					return interaction.success("moderation/giveaway:GIVEAWAY_REROLLED");
				})
				.catch(() => {
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

			client.giveawaysManager
				.delete(giveaway_id)
				.then(() => {
					return interaction.success("moderation/giveaway:GIVEAWAY_DELETED");
				})
				.catch(() => {
					return interaction.error("moderation/giveaway:NOT_FOUND", {
						messageId: giveaway_id,
					}, { ephemeral: true });
				});
		}
	}
}

module.exports = Giveaway;
