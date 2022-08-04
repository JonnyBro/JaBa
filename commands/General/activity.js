const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, InteractionCollector, PermissionsBitField, ComponentType } = require("discord.js"),
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
				.setDescription(client.translate("general/activity:DESCRIPTION")),
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
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");

		const perms = voice.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT");

		const activities = defaultApplications.map(a => {
			return {
				label: `${a.name} ${a.premium_tier_level ? `(${interaction.translate("general/activity:BOOST_NEEDED")})` : ""}`,
				value: a.id
			};
		});

		const row = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId("activity_select")
					.setPlaceholder(client.translate("common:NOTHING_SELECTED"))
					.addOptions(activities)
			);

		const msg = await interaction.reply({
			content: interaction.translate("general/activity:AVAILABLE_ACTIVITIES"),
			components: [row],
			fetchReply: true
		});

		const collector = new InteractionCollector(client, {
			componentType: ComponentType.SelectMenu,
			message: msg,
			idle: 60 * 1000
		});

		collector.on("collect", async msg => {
			const activity = msg?.values[0];

			const invite = await client.discordTogether.createTogetherCode(voice.id, activity);
			const embed = new EmbedBuilder()
				.setTitle(activity)
				.setColor(client.config.embed.color)
				.setDescription(`**[${interaction.translate("misc:CLICK_HERE", { activity: defaultApplications.find(a => a.id === activity).name, channel: voice.name })}](${invite.code})**`)
				.setFooter({
					text: client.config.embed.footer
				})
				.setTimestamp();

			await msg.update({
				embeds: [embed],
				components: []
			});
		});
	}
}

module.exports = Activity;