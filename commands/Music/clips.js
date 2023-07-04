const { SlashCommandBuilder, PermissionsBitField } = require("discord.js"),
	{ QueryType } = require("discord-player");
const BaseCommand = require("../../base/BaseCommand"),
	fs = require("fs");

class Clips extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("clips")
				.setDescription(client.translate("music/clips:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("music/clips:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/clips:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addStringOption(option =>
					option
						.setName("query")
						.setDescription(client.translate("music/clips:QUERY"))
						.setDescriptionLocalizations({
							uk: client.translate("music/clips:QUERY", null, "uk-UA"),
							ru: client.translate("music/clips:QUERY", null, "ru-RU"),
						})
						.setRequired(true)
						.setAutocomplete(true),
				),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
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
		await interaction.deferReply();

		const query = interaction.options.getString("query"),
			voice = interaction.member.voice.channel;
		if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL", null, { edit: true });

		const perms = voice.permissionsFor(client.user);
		if (!perms.has(PermissionsBitField.Flags.Connect) || !perms.has(PermissionsBitField.Flags.Speak)) return interaction.error("music/play:VOICE_CHANNEL_CONNECT", null, { edit: true });

		client.player.play(interaction.member.voice.channel, query, {
			nodeOptions: {
				metadata: {
					client,
					channel: interaction.channel,
					requestedBy: interaction.user,
				},
			},
			searchEngine: QueryType.FILE,
			selfDeaf: true,
			leaveOnEnd: false,
			leaveOnStop: true,
			skipOnNoStream: true,
			bufferingTimeout: 1000,
		});

		interaction.editReply({
			content: interaction.translate("music/play:ADDED_QUEUE", {
				songName: query.substring(8, query.length - 4),
			}),
		});
	}

	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").AutocompleteInteraction} interaction
	 * @returns
	 */
	async autocompleteRun(client, interaction) {
		const query = interaction.options.getString("query"),
			files = fs.readdirSync("./clips"),
			results = files.filter(f => f.includes(query));

		return interaction.respond(
			results.slice(0, 25).map(file => ({
				name: file.substring(0, file.length - 4),
				value: `./clips/${file}`,
			})),
		);
	}
}

module.exports = Clips;
