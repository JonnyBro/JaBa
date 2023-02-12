const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Boosters extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("boosters")
				.setDescription(client.translate("general/boosters:DESCRIPTION"))
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

		let currentPage = 0;
		const boosters = (await interaction.guild.members.fetch()).filter(m => m.premiumSince);
		const embeds = generateBoostersEmbeds(interaction, boosters);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("boosters_prev_page")
					.setStyle(ButtonStyle.Primary)
					.setEmoji("⬅️"),
				new ButtonBuilder()
					.setCustomId("boosters_next_page")
					.setStyle(ButtonStyle.Primary)
					.setEmoji("➡️"),
				new ButtonBuilder()
					.setCustomId("boosters_jump_page")
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("↗️"),
				new ButtonBuilder()
					.setCustomId("boosters_stop")
					.setStyle(ButtonStyle.Danger)
					.setEmoji("⏹️"),
			);

		await interaction.editReply({
			content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
			embeds: [embeds[currentPage]],
			components: [row],
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.guild === null ? (await interaction.user.createDM()).createMessageComponentCollector({ filter, idle: (20 * 1000) }) : interaction.channel.createMessageComponentCollector({ filter, idle: (20 * 1000) });

		collector.on("collect", async i => {
			if (i.isButton()) {
				if (i.customId === "boosters_prev_page") {
					i.deferUpdate();

					if (currentPage !== 0) {
						--currentPage;
						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (i.customId === "boosters_next_page") {
					i.deferUpdate();

					if (currentPage < embeds.length - 1) {
						currentPage++;
						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (i.customId === "boosters_jump_page") {
					i.deferUpdate();

					const msg = await interaction.followUp({
						content: interaction.translate("misc:JUMP_TO_PAGE", {
							length: embeds.length,
						}),
						fetchReply: true,
					});

					const filter = res => {
						return res.author.id === interaction.user.id && !isNaN(res.content);
					};

					interaction.channel.awaitMessages({ filter, max: 1, time: (10 * 1000) }).then(collected => {
						if (embeds[collected.first().content - 1]) {
							currentPage = collected.first().content - 1;
							interaction.editReply({
								content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
								embeds: [embeds[currentPage]],
								components: [row],
							});

							if (collected.first().deletable) collected.first().delete();
							if (msg.deletable) msg.delete();
						} else {
							if (collected.first().deletable) collected.first().delete();
							if (msg.deletable) msg.delete();
							return;
						}
					});
				} else if (i.customId === "boosters_stop") {
					i.deferUpdate();
					collector.stop();
				}
			}
		});

		collector.on("end", () => {
			row.components.forEach(component => {
				component.setDisabled(true);
			});

			return interaction.editReply({
				components: [row],
			});
		});
	}
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {Array} boosters
 * @returns
 */
function generateBoostersEmbeds(interaction, boosters) {
	const embeds = [];
	let k = 10;

	for (let i = 0; i < boosters.size; i += 10) {
		const current = boosters.sort((a, b) => b.premiumSinceTimestamp - a.premiumSinceTimestamp).map(g => g).slice(i, k);
		let j = i;
		k += 10;

		const info = current.map(member => `${++j}. ${member.toString()} | ${interaction.translate("general/boosters:BOOSTER_SINCE")}: **${interaction.client.printDate(member.premiumSince, null, interaction.guild.data.locale)}**`).join("\n");

		const embed = new EmbedBuilder()
			.setColor(interaction.client.config.embed.color)
			.setFooter({
				text: interaction.client.config.embed.footer,
			})
			.setTitle(interaction.translate("general/boosters:BOOSTERS_LIST"))
			.setDescription(info)
			.setTimestamp();
		embeds.push(embed);
	}

	return embeds;
}

module.exports = Boosters;