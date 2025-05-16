const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Reminds extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("reminds")
				.setDescription(client.translate("general/reminds:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/reminds:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/reminds:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild]),
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
			if (!interaction.customId.startsWith("reminds_")) return;

			interaction.data = [];
			interaction.data.guild = await client.getGuildData(interaction.guildId);
			interaction.data.user = await client.getUserData(interaction.user.id);

			const reminds = interaction.data.user.reminds,
				embeds = generateRemindsEmbeds(interaction, reminds);

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("reminds_prev_page").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
				new ButtonBuilder().setCustomId("reminds_next_page").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
				new ButtonBuilder().setCustomId("reminds_jump_page").setStyle(ButtonStyle.Secondary).setEmoji("↗️"),
				new ButtonBuilder().setCustomId("reminds_stop").setStyle(ButtonStyle.Danger).setEmoji("❌"),
			);

			let currentPage = Number(interaction.message.content.match(/\d+/g)[0]) - 1 ?? 0;

			if (interaction.customId === "reminds_prev_page") {
				await interaction.deferUpdate();

				if (currentPage !== 0) {
					--currentPage;

					const row2 = new ActionRowBuilder().addComponents(embeds[currentPage].data._buttons);

					interaction.editReply({
						content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
						embeds: [embeds[currentPage]],
						components: [row, row2],
					});
				}
			} else if (interaction.customId === "reminds_next_page") {
				await interaction.deferUpdate();

				if (currentPage < embeds.length - 1) {
					currentPage++;

					const row2 = new ActionRowBuilder().addComponents(embeds[currentPage].data._buttons);

					interaction.editReply({
						content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
						embeds: [embeds[currentPage]],
						components: [row, row2],
					});
				}
			} else if (interaction.customId === "reminds_jump_page") {
				await interaction.deferUpdate();

				const msg = await interaction.followUp({
					content: interaction.translate("misc:JUMP_TO_PAGE", {
						length: embeds.length,
					}),
					fetchReply: true,
					ephemeral: true,
				});

				const filter = res => {
					return res.author.id === interaction.user.id && !isNaN(res.content);
				};

				interaction.channel.awaitMessages({ filter, max: 1, time: 10 * 1000 }).then(collected => {
					if (embeds[collected.first().content - 1]) {
						currentPage = collected.first().content - 1;

						const row2 = new ActionRowBuilder().addComponents(embeds[currentPage].data._buttons);

						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
							embeds: [embeds[currentPage]],
							components: [row, row2],
						});

						if (collected.first().deletable) collected.first().delete();
						if (msg.deletable) msg.delete();
					} else {
						if (collected.first().deletable) collected.first().delete();
						if (msg.deletable) msg.delete();
						return;
					}
				});
			} else if (interaction.customId === "reminds_stop") {
				await interaction.deferUpdate();

				row.components.forEach(component => {
					component.setDisabled(true);
				});

				return interaction.editReply({
					components: [row],
				});
			} else if (interaction.customId.startsWith("reminds_delete_")) {
				await interaction.deferUpdate();

				const id = parseInt(interaction.customId.split("_")[2]);
				const remindToDelete = reminds[id - 1];

				interaction.data.user.reminds = reminds.filter(r => r.sendAt !== remindToDelete.sendAt);

				await interaction.data.user.save();

				const embeds = generateRemindsEmbeds(interaction, interaction.data.user.reminds);

				if (embeds.length === 0) return interaction.editReply({
					content: interaction.translate("general/reminds:NO_REMINDS"),
					embeds: [],
					components: [],
				});

				embeds.length <= 5 ? currentPage = 0 : currentPage;

				const row2 = new ActionRowBuilder().addComponents(embeds[currentPage].data._buttons);

				await interaction.editReply({
					content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
					embeds: [embeds[currentPage]],
					components: [row, row2],
				});

				return interaction.followUp({
					content: `${client.customEmojis.success} | ${interaction.translate("general/reminds:DELETED", { pos: id })}`,
					ephemeral: true,
				});
			}
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const reminds = interaction.data.user.reminds;
		if (reminds.length === 0) return interaction.error("general/reminds:NO_REMINDS", null, { edit: true });

		const embeds = generateRemindsEmbeds(interaction, reminds);

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("reminds_prev_page").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
			new ButtonBuilder().setCustomId("reminds_next_page").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
			new ButtonBuilder().setCustomId("reminds_jump_page").setStyle(ButtonStyle.Secondary).setEmoji("↗️"),
			new ButtonBuilder().setCustomId("reminds_stop").setStyle(ButtonStyle.Danger).setEmoji("❌"),
		);

		const buttonsRow = new ActionRowBuilder().addComponents(embeds[0].data._buttons);

		await interaction.editReply({
			content: `${interaction.translate("common:PAGE")}: **1**/**${embeds.length}**`,
			embeds: [embeds[0]],
			components: [row, buttonsRow],
			ephemeral: true,
		});
	}
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {Array} reminds
 * @returns
 */
function generateRemindsEmbeds(interaction, reminds) {
	const embeds = [];
	let k = 5;

	for (let i = 0; i < reminds.length; i += 5) {
		const current = reminds
			.sort((a, b) => a.createdAt - b.createdAt)
			.map(g => g)
			.slice(i, k);
		let j = i;
		k += 5;

		const info = current.map(r => `${++j}. ${interaction.client.translate("general/remindme:EMBED_CREATED")}: <t:${r.createdAt}:f>\n${interaction.client.translate("general/remindme:EMBED_TIME")}: <t:${r.sendAt}:f>\n${interaction.client.translate("common:MESSAGE")}: \`${r.message}\``).join("\n");

		const embed = interaction.client.embed({
			title: interaction.translate("general/reminds:REMINDS_LIST"),
			description: info,
		});

		embed.data._buttons = [];

		for (const key in current) {
			embed.data._buttons.push(
				new ButtonBuilder()
					.setCustomId(`reminds_delete_${parseInt(key) + i + 1}`)
					.setLabel(interaction.translate("general/reminds:DELETE", { pos: parseInt(key) + i + 1 }))
					.setStyle(ButtonStyle.Danger),
			);
		}

		embeds.push(embed);
	}


	return embeds;
}

module.exports = Reminds;
