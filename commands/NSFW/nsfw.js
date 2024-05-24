const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, AttachmentBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class NSFW extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("nsfw")
				.setDescription(client.translate("nsfw/nsfw:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("nsfw/nsfw:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("nsfw/nsfw:DESCRIPTION", null, "ru-RU"),
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
			if (!interaction.isStringSelectMenu()) return;

			if (interaction.customId === "nsfw_select") {
				await interaction.deferUpdate();

				interaction.data = [];
				interaction.data.guild = await client.getGuildData(interaction.guildId);

				const tag = interaction?.values[0],
					splitted = tag.split("_"),
					res = await fetch(`https://nsfw-api.jababot.ru/media/${splitted[0].charAt(0).toLowerCase()}/${splitted[1].toLowerCase()}`).then(async r => await r.buffer()),
					image = new AttachmentBuilder(res, { name: "image.jpeg" });

				const embed = client.embed({
					image: "attachment://image.jpeg",
				});

				await interaction.editReply({
					embeds: [embed],
					files: [image],
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

		if (interaction.guild && !interaction.channel.nsfw) return interaction.error("misc:NSFW_COMMAND", null, { edit: true, ephemeral: true });

		const tags = ["Hentai_Vanila", "Hentai_Yaoi", "Hentai_Yuri", "Hentai_BDSM", "Hentai_Trap", "Real_Ass", "Real_Boobs", "Real_Pussy"]
			.map(tag =>
				JSON.parse(
					JSON.stringify({
						label: `(${tag.split("_")[0]}) ${tag.split("_")[1]}`,
						value: tag,
					}),
				),
			);

		const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("nsfw_select").setPlaceholder(interaction.translate("common:NOTHING_SELECTED")).addOptions(tags.slice(0, 25)));

		await interaction.editReply({
			content: interaction.translate("common:AVAILABLE_OPTIONS"),
			ephemeral: true,
			components: [row],
		});
	}
}

module.exports = NSFW;
