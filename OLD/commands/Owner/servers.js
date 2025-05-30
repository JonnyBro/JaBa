const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Servers extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
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
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild]),
			dirname: __dirname,
			ownerOnly: true,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		let currentPage = 0;
		const embeds = generateGuildsEmbeds(interaction, client.guilds.cache);

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("servers_prev_page").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
			new ButtonBuilder().setCustomId("servers_next_page").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
			new ButtonBuilder().setCustomId("servers_stop").setStyle(ButtonStyle.Danger).setEmoji("❌"),
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
 * @param {Array[import("discord.js").Guild]} guilds
 * @returns
 */
function generateGuildsEmbeds(interaction, guilds) {
	const embeds = [];
	let k = 10;

	for (let i = 0; i < guilds.size; i += 10) {
		const current = guilds
			.sort((a, b) => b.memberCount - a.memberCount)
			.map(g => g)
			.slice(i, k);
		let j = i;
		k += 10;

		const info = current
			.map(
				guild =>
					`${++j}. ${guild.name} (${guild.id}) | ${guild.memberCount} ${interaction.client.functions.getNoun(
						guild.memberCount,
						interaction.translate("misc:NOUNS:MEMBERS:1"),
						interaction.translate("misc:NOUNS:MEMBERS:2"),
						interaction.translate("misc:NOUNS:MEMBERS:5"),
					)}`,
			)
			.join("\n");

		const embed = interaction.client.embed({
			title: interaction.translate("owner/servers:SERVERS_LIST"),
			description: info,
		});

		embeds.push(embed);
	}

	return embeds;
}

module.exports = Servers;
