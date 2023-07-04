const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Servers extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("servers")
				.setDescription(client.translate("owner/servers:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("owner/servers:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("owner/servers:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true),
			aliases: [],
			dirname: __dirname,
			ownerOnly: true,
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
		await interaction.deferReply({ ephemeral: true });

		let currentPage = 0;
		const embeds = generateServersEmbeds(interaction, client.guilds.cache);

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("servers_prev_page").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
			new ButtonBuilder().setCustomId("servers_next_page").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
			new ButtonBuilder().setCustomId("servers_stop").setStyle(ButtonStyle.Danger).setEmoji("⏹️"),
		);

		await interaction.editReply({
			content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
			embeds: [embeds[currentPage]],
			components: [row],
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = interaction.guild === null ? (await interaction.user.createDM()).createMessageComponentCollector({ filter, idle: 20 * 1000 }) : interaction.channel.createMessageComponentCollector({ filter, idle: 20 * 1000 });

		collector.on("collect", async i => {
			if (i.isButton()) {
				if (i.customId === "servers_prev_page") {
					i.deferUpdate();

					if (currentPage !== 0) {
						--currentPage;
						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (i.customId === "servers_next_page") {
					i.deferUpdate();

					if (currentPage < embeds.length - 1) {
						currentPage++;
						interaction.editReply({
							content: `${interaction.translate("common:PAGE")}: **${currentPage + 1}**/**${embeds.length}**`,
							embeds: [embeds[currentPage]],
							components: [row],
						});
					}
				} else if (i.customId === "servers_stop") {
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
 * @param {Array} servers
 * @returns
 */
function generateServersEmbeds(interaction, servers) {
	const embeds = [];
	let k = 10;

	for (let i = 0; i < servers.size; i += 10) {
		const current = servers
			.sort((a, b) => b.memberCount - a.memberCount)
			.map(g => g)
			.slice(i, k);
		let j = i;
		k += 10;

		const info = current
			.map(
				server =>
					`${++j}. ${server.name} | ${server.memberCount} ${interaction.client.functions.getNoun(
						server.memberCount,
						interaction.translate("misc:NOUNS:MEMBERS:1"),
						interaction.translate("misc:NOUNS:MEMBERS:2"),
						interaction.translate("misc:NOUNS:MEMBERS:5"),
					)}`,
			)
			.join("\n");

		const embed = new EmbedBuilder()
			.setColor(interaction.client.config.embed.color)
			.setFooter({
				text: interaction.client.config.embed.footer,
			})
			.setTitle(interaction.translate("owner/servers:SERVERS_LIST"))
			.setDescription(info)
			.setTimestamp();
		embeds.push(embed);
	}

	return embeds;
}

module.exports = Servers;
