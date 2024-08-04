const { SlashCommandBuilder } = require("discord.js");
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
				.setDescription(client.translate("beatrun.ru/courses:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("beatrun.ru/courses:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("beatrun.ru/courses:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addStringOption(option =>
					option
						.setName("code")
						.setDescription(client.translate("common:CODE"))
						.setDescriptionLocalizations({
							uk: client.translate("common:CODE", null, "uk-UA"),
							ru: client.translate("common:CODE", null, "ru-RU"),
						})
						.setRequired(true),
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
		await interaction.deferReply();

		const code = interaction.options.getString("code");

		const response = await fetch(`https://courses.jonnybro.ru/api/info/${code}`).then(res => res.json());
		const course = response.data;

		if (response.res === 401) return interaction.error("beatrun.ru/courses:NOT_FOUND", null, { ephemeral: true, edit: true });

		const embed = client.embed({
			title: course.name,
			description: `[${interaction.translate("beatrun.ru/courses:DOWNLOAD")}](https://courses.jonnybro.ru/${course.path})`,
			thumbnail: course.mapimg,
			url: `https://courses.jonnybro.ru/?search=${code}`,
			fields: [
				{
					name: interaction.translate("beatrun.ru/courses:MAP"),
					value: `[${course.map}](https://steamcommunity.com/sharedfiles/filedetails/?id=${course.mapid})`,
					inline: true,
				},
				{
					name: interaction.translate("beatrun.ru/courses:UPLOADER"),
					value: `[${course.uploader.name || course.uploader.userid}](https://steamcommunity.com/profiles/${course.uploader.userid})`,
					inline: true,
				},
				{
					name: "\u200B",
					value: "\u200B",
					inline: true,
				},
				{
					name: interaction.translate("beatrun.ru/courses:DATE"),
					value: `<t:${Math.floor(course.time / 1000)}:D>`,
					inline: true,
				},
				{
					name: interaction.translate("beatrun.ru/courses:PLAYS"),
					value: `${course.plays || 0}`,
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
