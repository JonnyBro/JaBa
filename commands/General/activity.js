const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require("discord.js"),
	{ defaultApplications } = require("../../helpers/discordTogether");
const BaseCommand = require("../../base/BaseCommand");

class Activity extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("activity")
				.setDescription(client.translate("general/activity:DESCRIPTION"))
				.setDMPermission(false),
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
		await interaction.deferReply();

		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");

		const perms = voice.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT");

		const activities = defaultApplications.map(a => {
			return {
				label: `${a.name} ${a.premium_tier_level ? `(${interaction.translate("general/activity:BOOST_NEEDED")})` : ""}`,
				value: a.id,
			};
		});

		const row = new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("activity_select")
					.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
					.addOptions(activities),
			);

		await interaction.editReply({
			content: interaction.translate("general/activity:AVAILABLE_ACTIVITIES"),
			components: [row],
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (15 * 1000) });

		collector.on("collect", async i => {
			if (i.isStringSelectMenu() && i.customId === "activity_select") {
				const activity = i?.values[0];

				const invite = await client.discordTogether.createTogetherCode(voice.id, activity);
				const embed = new EmbedBuilder()
					.setTitle(defaultApplications.find(a => a.id === activity).name)
					.setColor(client.config.embed.color)
					.setDescription(`**[${interaction.translate("general/activity:CLICK_HERE", {
						activity: defaultApplications.find(a => a.id === activity).name,
						channel: voice.name,
					})}](${invite.code})**`)
					.setFooter({
						text: client.config.embed.footer,
					})
					.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
					components: [],
				});
			}
		});

		collector.on("end", () => {
			return interaction.editReply({
				components: [],
			});
		});
	}
}

module.exports = Activity;