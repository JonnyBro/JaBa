const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");
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
				.setDescriptionLocalizations({ "uk": client.translate("owner/announcement:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(true)
				.addStringOption(option => option.setName("message")
					.setDescription(client.translate("common:MESSAGE"))
					.setDescriptionLocalizations({ "uk": client.translate("common:MESSAGE", null, "uk-UA") })
					.setRequired(true))
				.addBooleanOption(option => option.setName("tag")
					.setDescription(client.translate("owner/announcement:TAG"))
					.setDescriptionLocalizations({ "uk": client.translate("owner/announcement:TAG", null, "uk-UA") })
					.setRequired(true))
				.addBooleanOption(option => option.setName("important")
					.setDescription(client.translate("owner/announcement:IMPORTANT"))
					.setDescriptionLocalizations({ "uk": client.translate("owner/announcement:IMPORTANT", null, "uk-UA") })),
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
		const text = interaction.options.getString("message"),
			important = interaction.options.getBoolean("important");
		if (text.length > 1000) return interaction.error("owner/announcement:TOO_LONG");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.translate("owner/announcement:TITLE"),
			})
			.setDescription(text)
			.setColor(client.config.embed.color)
			.setFooter({
				text: interaction.user.discriminator === "0" ? interaction.user.username : interaction.user.tag,
			})
			.setTimestamp();

		(await client.guilds.fetch()).forEach(async guild => {
			if (guild.id === "568120814776614924") return;

			guild = await guild.fetch();
			const channel = important ? (guild?.data?.plugins.news ? guild.channels.cache.get(guild?.data?.plugins.news) : guild.channels.cache.find(c => c.type === ChannelType.GuildText)) : guild.channels.cache.get(guild?.data?.plugins.news);

			channel.send({
				content: `${interaction.options.getBoolean("tag") ? "||@everyone|| " : ""}ВАЖНОЕ ОБЪЯВЛЕНИЕ!`,
				embeds: [embed],
			});
		});

		interaction.editReply({
			content: interaction.translate("owner/announcement:SENDED"),
			ephemeral: true,
		});
	}
}

module.exports = Announcement;