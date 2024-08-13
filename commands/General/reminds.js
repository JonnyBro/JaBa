const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
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
				.setDMPermission(true),
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

			const row2 = new ActionRowBuilder();

			for (const key in reminds) {
				row2.addComponents(
					new ButtonBuilder()
						.setCustomId(`reminds_delete_${key}`)
						.setLabel(interaction.translate("general/reminds:DELETE", { pos: parseInt(key) + 1 }))
						.setStyle(ButtonStyle.Danger),
				);
			}

			if (interaction.customId === "reminds_prev_page") {
				await interaction.deferUpdate();

				if (currentPage !== 0) {
					--currentPage;
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
					components: [row, row2],
				});
			} else if (interaction.customId.startsWith("reminds_delete_")) {
				await interaction.deferUpdate();

				const id = parseInt(interaction.customId.split("_")[2]);
				const remindToDelete = reminds[id];

				interaction.data.user.reminds = reminds.filter(r => r.sendAt !== remindToDelete.sendAt);

				await interaction.data.user.save();

				return interaction.followUp({
					content: `${client.customEmojis.success} | ${interaction.translate("general/reminds:DELETED", { pos: id + 1 })}`,
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

		const row2 = new ActionRowBuilder();

		for (const key in reminds) {
			row2.addComponents(
				new ButtonBuilder()
					.setCustomId(`reminds_delete_${key}`)
					.setLabel(interaction.translate("general/reminds:DELETE", { pos: parseInt(key) + 1 }))
					.setStyle(ButtonStyle.Danger),
			);
		}

		await interaction.editReply({
			content: `${interaction.translate("common:PAGE")}: **1**/**${embeds.length}**`,
			embeds: [embeds[0]],
			components: [row, row2],
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

		embeds.push(embed);
	}

	return embeds;
}

module.exports = Reminds;
