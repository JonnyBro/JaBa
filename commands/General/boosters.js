const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Boosters extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("boosters")
				.setDescription(client.translate("general/boosters:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/boosters:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/boosters:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad(client) {
		client.on("interactionCreate", async interaction => {
			if (!interaction.isButton()) return;

			if (interaction.customId.startsWith("boosters_")) {
				interaction.data = [];
				interaction.data.guild = await client.getGuildData(interaction.guildId);

				const boosters = (await interaction.guild.members.fetch()).filter(m => m.premiumSince),
					embeds = generateBoostersEmbeds(interaction, boosters);

				const row = new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId("boosters_prev_page").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
					new ButtonBuilder().setCustomId("boosters_next_page").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
					new ButtonBuilder().setCustomId("boosters_jump_page").setStyle(ButtonStyle.Secondary).setEmoji("↗️"),
					new ButtonBuilder().setCustomId("boosters_stop").setStyle(ButtonStyle.Danger).setEmoji("❌"),
				);

				let currentPage = Number(interaction.message.content.match(/\d+/g)[0]) - 1 ?? 0;

				if (interaction.customId === "boosters_prev_page") {
					await interaction.deferUpdate();

					if (currentPage !== 0) {
						--currentPage;
						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (interaction.customId === "boosters_next_page") {
					await interaction.deferUpdate();

					if (currentPage < embeds.length - 1) {
						currentPage++;
						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (interaction.customId === "boosters_jump_page") {
					await interaction.deferUpdate();

					const msg = await interaction.followUp({
						content: interaction.translate("misc:JUMP_TO_PAGE", {
							length: embeds.length,
						}),
						fetchReply: true,
					});

					const filter = res => {
						return res.author.id === interaction.user.id && !isNaN(res.content);
					};

					interaction.channel.awaitMessages({ filter, max: 1, time: 10 * 1000 }).then(collected => {
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
				} else if (interaction.customId === "boosters_stop") {
					await interaction.deferUpdate();

					row.components.forEach(component => {
						component.setDisabled(true);
					});

					return interaction.editReply({
						components: [row],
					});
				}
			}
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const boosters = (await interaction.guild.members.fetch()).filter(m => m.premiumSince);
		if (boosters.size === 0) return interaction.error("general/boosters:NO_BOOSTERS", null, { edit: true });

		const embeds = generateBoostersEmbeds(client, interaction, boosters);

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("boosters_prev_page").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
			new ButtonBuilder().setCustomId("boosters_next_page").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
			new ButtonBuilder().setCustomId("boosters_jump_page").setStyle(ButtonStyle.Secondary).setEmoji("↗️"),
			new ButtonBuilder().setCustomId("boosters_stop").setStyle(ButtonStyle.Danger).setEmoji("❌"),
		);

		await interaction.editReply({
			content: `${interaction.translate("common:PAGE")}: **1**/**${embeds.length}**`,
			embeds: [embeds[0]],
			components: [row],
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
		const current = boosters
			.sort((a, b) => a.premiumSinceTimestamp - b.premiumSinceTimestamp)
			.map(g => g)
			.slice(i, k);
		let j = i;
		k += 10;

		const info = current.map(member => `${++j}. ${member.toString()} | ${interaction.translate("general/boosters:BOOSTER_SINCE")}: **${Math.floor(new Date(member.premiumSince).getTime() / 1000)}**`).join("\n");

		const embed = interaction.client.embed({
			title: interaction.translate("general/boosters:BOOSTERS_LIST"),
			description: info,
		});

		embeds.push(embed);
	}

	return embeds;
}

module.exports = Boosters;
