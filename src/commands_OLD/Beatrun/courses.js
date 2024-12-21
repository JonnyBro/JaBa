const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Courses extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("courses")
				.setDescription(client.translate("beatrun/courses:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("beatrun/courses:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("beatrun/courses:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
				.addStringOption(option =>
					option
						.setName("code")
						.setDescription(client.translate("common:CODE"))
						.setDescriptionLocalizations({
							uk: client.translate("common:CODE", null, "uk-UA"),
							ru: client.translate("common:CODE", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addBooleanOption(option =>
					option
						.setName("ephemeral")
						.setDescription(client.translate("misc:EPHEMERAL_RESPONSE"))
						.setDescriptionLocalizations({
							uk: client.translate("misc:EPHEMERAL_RESPONSE", null, "uk-UA"),
							ru: client.translate("misc:EPHEMERAL_RESPONSE", null, "ru-RU"),
						}),
				),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral") || false });

		const code = interaction.options.getString("code");
		const response = await fetch(`https://courses.jonnybro.ru/api/info/${code}`).then(res => res.json()),
			{ data } = response;

		if (response.res === 401) return interaction.error("beatrun/courses:NOT_FOUND", null, { ephemeral: true, edit: true });

		const embed = client.embed({
			title: data.name,
			description: `[${interaction.translate("beatrun/courses:DOWNLOAD")}](https://courses.jonnybro.ru/${data.path})`,
			thumbnail: data.mapimg,
			url: `https://courses.jonnybro.ru/?search=${code}`,
			fields: [
				{
					name: interaction.translate("beatrun/courses:MAP"),
					value: `[${data.map}](https://steamcommunity.com/sharedfiles/filedetails/?id=${data.mapid})`,
					inline: true,
				},
				{
					name: interaction.translate("beatrun/courses:UPLOADER"),
					value: `[${data.uploader.name || data.uploader.userid}](https://steamcommunity.com/profiles/${data.uploader.userid})`,
					inline: true,
				},
				{
					name: "\u200B",
					value: "\u200B",
					inline: true,
				},
				{
					name: interaction.translate("beatrun/courses:DATE"),
					value: `<t:${Math.floor(data.time / 1000)}:D>`,
					inline: true,
				},
				{
					name: interaction.translate("beatrun/courses:PLAYS"),
					value: `${data.plays || 0}`,
					inline: true,
				},
			],
		});

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Courses;
