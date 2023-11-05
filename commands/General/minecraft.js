const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	gamedig = require("gamedig");

class Minecraft extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("minecraft")
				.setDescription(client.translate("general/minecraft:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/minecraft:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/minecraft:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(true)
				.addStringOption(option =>
					option
						.setName("ip")
						.setDescription(client.translate("common:IP"))
						.setDescriptionLocalizations({
							uk: client.translate("common:IP", null, "uk-UA"),
							ru: client.translate("common:IP", null, "ru-RU"),
						})
						.setRequired(true),
				),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
		});
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const ip = interaction.options.getString("ip");
		const options = {
			type: "minecraft",
			host: ip,
		};

		if (ip.split(":").length > 1) {
			const splitIp = ip.split(":");
			options.host = splitIp[0];
			options.port = splitIp[1];
		}

		let res = await gamedig.query(options).catch(() => {});

		if (!res) {
			options.type = "minecraftpe";
			res = await gamedig.query(options).catch(() => {});
		}

		if (!res) return interaction.error("general/minecraft:FAILED", null, { edit: true });

		const embed = new EmbedBuilder()
			.setAuthor({
				name: res.name || "Unknown",
			})
			.addFields([
				{
					name: interaction.translate("general/minecraft:FIELD_STATUS"),
					value: interaction.translate("general/minecraft:ONLINE"),
				},
				{
					name: interaction.translate("general/minecraft:FIELD_CONNECTED"),
					value: `**${res.raw.players ? res.raw.players.online : res.players.length}** ${client.functions.getNoun(
						res.raw.players ? res.raw.players.online : res.players.length,
						interaction.translate("misc:NOUNS:PLAYERS:1"),
						interaction.translate("misc:NOUNS:PLAYERS:2"),
						interaction.translate("misc:NOUNS:PLAYERS:5"),
					)} / **${res.raw.players ? res.raw.players.max : res.maxplayers}** ${client.functions.getNoun(
						res.raw.players ? res.raw.players.max : res.maxplayers,
						interaction.translate("misc:NOUNS:PLAYERS:1"),
						interaction.translate("misc:NOUNS:PLAYERS:2"),
						interaction.translate("misc:NOUNS:PLAYERS:5"),
					)}`,
				},
				{
					name: interaction.translate("general/minecraft:FIELD_IP"),
					value: res.connect,
					inline: true,
				},
				{
					name: interaction.translate("general/minecraft:FIELD_VERSION"),
					value: res.raw.vanilla.raw.version.name,
					inline: true,
				},
				{
					name: interaction.translate("general/minecraft:FIELD_PING"),
					value: res.raw.vanilla.ping.toString(),
				},
			])
			.setColor(client.config.embed.color)
			.setThumbnail(`https://eu.mc-api.net/v3/server/favicon/${ip}`)
			.setFooter(client.config.embed.footer);

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Minecraft;
