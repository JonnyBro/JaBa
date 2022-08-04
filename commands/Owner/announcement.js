const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Announcement extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("announcement")
				.setDescription(client.translate("owner/announcement:DESCRIPTION"))
				.addStringOption(option => option.setName("message")
					.setDescription(client.translate("common:MESSAGE"))
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: true
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
		await interaction.deferReply({ ephemeral: true });
		const text = interaction.options.getString("message");
		if (text.length > 1000) return interaction.error("owner/announcement:TOO_LONG");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("owner/announcement:TITLE")
			})
			.setDescription(text)
			.setColor(client.config.embed.color)
			.setFooter({
				text: interaction.user.tag
			})
			.setTimestamp();

		client.guilds.cache.forEach(async guild => {
			if (guild.id === "568120814776614924") return;
			const channel = guild.channels.cache.get(guild?.data.plugins.news);
			await channel.send({
				content: "||@everyone|| ВАЖНОЕ ОБЪЯВЛЕНИЕ!",
				embeds: [embed]
			});
		});

		interaction.editReply({
			content: interaction.translate("owner/announcement:SENDED"),
			ephemeral: true
		});
	}
}

module.exports = Announcement;