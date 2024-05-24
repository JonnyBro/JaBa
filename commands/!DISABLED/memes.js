const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Memes extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("memes")
				.setDescription(client.translate("fun/memes:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("fun/memes:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("fun/memes:DESCRIPTION", null, "ru-RU"),
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
			if (!interaction.isStringSelectMenu()) return;

			if (interaction.customId === "memes_select") {
				interaction.deferUpdate();

				interaction.guild.data = await client.getGuildData(interaction.guildId);

				const tag = interaction.values[0];
				const res = await fetch(`https://meme-api.com/gimme/${tag}`).then(response => response.json());

				const embed = client.embed({
					title: res.title,
					description: `${interaction.translate("fun/memes:SUBREDDIT")}: **${res.subreddit}**\n${interaction.translate("common:AUTHOR")}: **${res.author}**\n${interaction.translate("fun/memes:UPS")}: **${res.ups}**`,
					image: res.url,
				});

				await interaction.editReply({
					embeds: [embed],
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

		const tags = ["funny", "memes", "dankmemes", "me_irl", "wholesomememes"].map(tag =>
			JSON.parse(
				JSON.stringify({
					label: tag,
					value: tag,
				}),
			),
		);

		const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("memes_select").setPlaceholder(interaction.translate("common:NOTHING_SELECTED")).addOptions(tags));

		await interaction.editReply({
			components: [row],
		});
	}
}

module.exports = Memes;
